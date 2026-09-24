import { and, asc, eq, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db";
import { classMailOutbox, type ClassMailOutboxRow } from "@/lib/db/class-mail-schema";
import { bookings, experiences, type Booking } from "@/lib/db/schema";
import type { EmailMessage, SendResult } from "@/lib/email";

export type ClassMailKind = "confirmation" | "cancellation" | "reminder";

const LEASE_MS = 5 * 60_000;
const RETRY_MS = 60_000;
const DEFAULT_LIMIT = 20;

export function isClassBooking(booking: Booking): boolean {
  return booking.classSessionId != null && booking.classDetails != null;
}

/** Stable across retries and process restarts; the unique index makes enqueue duplicate-safe. */
export function classMailEventKey(booking: Pick<Booking, "id">, kind: ClassMailKind): string {
  return `class-booking:${booking.id}:${kind}`;
}

export async function enqueueClassMail(
  booking: Booking,
  kind: ClassMailKind,
  message: EmailMessage,
  db?: Db,
): Promise<SendResult> {
  if (!isClassBooking(booking)) return "refused";
  try {
    const conn = db ?? (await getDb());
    if (kind === "cancellation") {
      await conn
        .update(classMailOutbox)
        .set({ status: "suppressed", leaseUntil: null, lastError: "Booking was cancelled" })
        .where(
          and(
            eq(classMailOutbox.bookingId, booking.id),
            inArray(classMailOutbox.kind, ["confirmation", "reminder"]),
            isNull(classMailOutbox.sentAt),
          ),
        );
    }
    await conn
      .insert(classMailOutbox)
      .values({
        bookingId: booking.id,
        eventKey: classMailEventKey(booking, kind),
        kind,
        recipient: booking.email,
        message,
      })
      .onConflictDoNothing({ target: classMailOutbox.eventKey });
    return "sent";
  } catch (err) {
    console.error(`[email] failed to enqueue class ${kind} for booking ${booking.id}`, err);
    return "refused";
  }
}

export type ClassMailQueueResult = {
  claimed: number;
  sent: number;
  failed: number;
  skipped: number;
};

export type ProcessClassMailOptions = {
  now?: Date;
  limit?: number;
  send?: (kind: ClassMailKind, to: string, message: EmailMessage, idempotencyKey: string) => Promise<SendResult>;
};

type ClassMailSender = NonNullable<ProcessClassMailOptions["send"]>;

async function defaultSender(kind: ClassMailKind, to: string, message: EmailMessage, idempotencyKey: string): Promise<SendResult> {
  const { sendEmail } = await import("@/lib/email");
  return sendEmail(kind, to, message, { idempotencyKey });
}

async function claimOne(db: Db, now: Date, eventKey?: string): Promise<ClassMailOutboxRow | null> {
  const candidates = await db
    .select()
    .from(classMailOutbox)
    .where(
      and(
        eventKey ? eq(classMailOutbox.eventKey, eventKey) : undefined,
        lte(classMailOutbox.availableAt, now),
        or(eq(classMailOutbox.status, "pending"), and(eq(classMailOutbox.status, "sending"), lte(classMailOutbox.leaseUntil, now))),
      ),
    )
    .orderBy(asc(classMailOutbox.createdAt))
    .limit(1);
  const candidate = candidates[0];
  if (!candidate) return null;
  const claimed = await db
    .update(classMailOutbox)
    .set({
      status: "sending",
      leaseUntil: new Date(now.getTime() + LEASE_MS),
      attempts: sql`${classMailOutbox.attempts} + 1`,
      lastError: null,
    })
    .where(
      and(
        eq(classMailOutbox.id, candidate.id),
        or(eq(classMailOutbox.status, "pending"), and(eq(classMailOutbox.status, "sending"), lte(classMailOutbox.leaseUntil, now))),
      ),
    )
    .returning();
  return claimed[0] ?? null;
}

async function deliverClaimed(db: Db, row: ClassMailOutboxRow, now: Date, send: ClassMailSender): Promise<SendResult> {
  if (row.kind === "confirmation" || row.kind === "reminder") {
    const current = await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.id, row.bookingId)).limit(1);
    if (current[0] && current[0].status !== "confirmed") {
      await db
        .update(classMailOutbox)
        .set({ status: "suppressed", leaseUntil: null, lastError: "Booking is no longer confirmed" })
        .where(eq(classMailOutbox.id, row.id));
      return "refused";
    }
  }
  let delivery: SendResult;
  try {
    delivery = await send(row.kind as ClassMailKind, row.recipient, row.message, row.eventKey);
  } catch (err) {
    console.error(`[email] class delivery threw for ${row.eventKey}`, err);
    delivery = "refused";
  }
  if (delivery === "sent") {
    await db
      .update(classMailOutbox)
      .set({ status: "sent", sentAt: now, leaseUntil: null, lastError: null })
      .where(and(eq(classMailOutbox.id, row.id), eq(classMailOutbox.status, "sending")));
    return delivery;
  }
  await db
    .update(classMailOutbox)
    .set({
      status: "pending",
      leaseUntil: null,
      availableAt: new Date(now.getTime() + RETRY_MS),
      lastError: delivery === "skipped" ? "Email is not configured" : "Delivery refused",
    })
    .where(and(eq(classMailOutbox.id, row.id), eq(classMailOutbox.status, "sending"), isNull(classMailOutbox.sentAt)));
  return delivery;
}

/**
 * Persists first, then awaits an immediate delivery attempt. A refusal or
 * missing key leaves the row pending for cron; an already-sent duplicate is
 * treated as sent so callers can safely retry the booking operation.
 */
export async function deliverClassMail(
  booking: Booking,
  kind: ClassMailKind,
  message: EmailMessage,
  opts: { db?: Db; now?: Date; send?: ClassMailSender } = {},
): Promise<SendResult> {
  const conn = opts.db ?? (await getDb());
  const queued = await enqueueClassMail(booking, kind, message, conn);
  if (queued !== "sent") return queued;
  const eventKey = classMailEventKey(booking, kind);
  const existing = await conn.select().from(classMailOutbox).where(eq(classMailOutbox.eventKey, eventKey)).limit(1);
  if (existing[0]?.status === "sent") return "sent";
  const now = opts.now ?? new Date();
  const row = await claimOne(conn, now, eventKey);
  if (!row) return existing[0]?.lastError === "Email is not configured" ? "skipped" : "refused";
  return deliverClaimed(conn, row, now, opts.send ?? defaultSender);
}

/**
 * Drains a bounded batch. Claims have expiring leases, so a crashed worker is
 * retried, and Resend receives the same key if the first response was lost.
 */
export async function processClassMailQueue(db?: Db, opts: ProcessClassMailOptions = {}): Promise<ClassMailQueueResult> {
  const conn = db ?? (await getDb());
  const now = opts.now ?? new Date();
  const limit = Math.max(1, Math.min(opts.limit ?? DEFAULT_LIMIT, 100));
  const send = opts.send ?? defaultSender;
  const result: ClassMailQueueResult = { claimed: 0, sent: 0, failed: 0, skipped: 0 };

  for (let i = 0; i < limit; i++) {
    const row = await claimOne(conn, now);
    if (!row) break;
    result.claimed++;
    const delivery = await deliverClaimed(conn, row, now, send);
    if (delivery === "sent") {
      result.sent++;
      continue;
    }
    result[delivery === "skipped" ? "skipped" : "failed"]++;
  }
  return result;
}

export type ClassMailReconcileResult = { scanned: number; enqueued: number; failed: number };

/**
 * Repairs the commit-before-enqueue crash window. It is intentionally safe on
 * every cron run: event_key uniqueness turns repeated reconciliation into a
 * no-op.
 */
export async function reconcileClassMailOutbox(db?: Db): Promise<ClassMailReconcileResult> {
  const conn = db ?? (await getDb());
  const rows = await conn
    .select({ booking: bookings, experience: experiences })
    .from(bookings)
    .innerJoin(experiences, eq(bookings.experienceId, experiences.id))
    .where(
      and(
        isNotNull(bookings.classSessionId),
        isNotNull(bookings.classDetails),
        inArray(bookings.status, ["confirmed", "cancelled"]),
        sql`NOT EXISTS (
          SELECT 1 FROM class_mail_outbox existing_mail
          WHERE existing_mail.event_key =
            'class-booking:' || ${bookings.id}::text || ':' ||
            CASE WHEN ${bookings.status} = 'cancelled' THEN 'cancellation' ELSE 'confirmation' END
        )`,
      ),
    )
    .orderBy(asc(bookings.id))
    .limit(500);
  const result: ClassMailReconcileResult = { scanned: rows.length, enqueued: 0, failed: 0 };
  const { confirmationText, cancellationText } = await import("@/lib/email");
  for (const { booking, experience } of rows) {
    const kind: ClassMailKind = booking.status === "cancelled" ? "cancellation" : "confirmation";
    const message = kind === "confirmation" ? confirmationText(booking, experience) : cancellationText(booking, experience, "guest");
    const queued = await enqueueClassMail(booking, kind, message, conn);
    if (queued === "sent") {
      result.enqueued++;
    } else {
      result.failed++;
    }
  }
  return result;
}

export { ensureClassMailSchema } from "@/lib/db/class-mail-schema";
