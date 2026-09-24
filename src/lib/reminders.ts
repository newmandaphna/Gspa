/**
 * The day-before reminder. A daily cron (GET /api/cron/reminders, 10:00 ET)
 * mails every confirmed reservation that starts tomorrow in the club's
 * timezone and has not been reminded yet. `reminder_sent_at` is the claim as
 * well as the record: a row is stamped before its email goes out, only if it
 * was still unstamped, so two overlapping runs (a slow first request and its
 * retry) cannot both mail the same guest. A send that does not go through
 * clears the stamp again.
 */
import { and, asc, eq, gte, isNull, lt } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db";
import { ensureSchema } from "@/lib/db/migrate";
import { bookings, experiences, type Booking, type Experience } from "@/lib/db/schema";
import { sendBookingReminder, type SendResult } from "@/lib/email";
import { SITE } from "@/lib/config/site";
import { addDaysIso, todayIso, zonedToUtc } from "@/lib/time";

export type ReminderWindow = { dateISO: string; from: Date; to: Date };

/** Tomorrow, as a calendar day in the club's timezone, as a UTC interval [from, to). */
export function reminderWindow(now: Date = new Date(), tz: string = SITE.timezone): ReminderWindow {
  const dateISO = addDaysIso(todayIso(tz, now), 1);
  return { dateISO, from: zonedToUtc(dateISO, "00:00", tz), to: zonedToUtc(addDaysIso(dateISO, 1), "00:00", tz) };
}

export type ReminderRow = { booking: Booking; experience: Experience };

/** Confirmed, starting tomorrow, not yet reminded. Earliest first. */
export async function listDueReminders(db: Db, now: Date = new Date()): Promise<ReminderRow[]> {
  const { from, to } = reminderWindow(now);
  const query = () =>
    db
      .select({ booking: bookings, experience: experiences })
      .from(bookings)
      .innerJoin(experiences, eq(bookings.experienceId, experiences.id))
      .where(and(eq(bookings.status, "confirmed"), gte(bookings.startsAt, from), lt(bookings.startsAt, to), isNull(bookings.reminderSentAt)))
      .orderBy(asc(bookings.startsAt));
  try {
    return await query();
  } catch (err) {
    // A server that was already up when this column arrived has not run the migration yet.
    if (!/reminder_sent_at/.test(String(err))) throw err;
    await ensureSchema(db);
    return query();
  }
}

/** Stamps the row, but only while it is unstamped. False means another run got there first. */
export async function claimReminder(db: Db, bookingId: number, at: Date): Promise<boolean> {
  const rows = await db
    .update(bookings)
    .set({ reminderSentAt: at })
    .where(and(eq(bookings.id, bookingId), isNull(bookings.reminderSentAt)))
    .returning({ id: bookings.id });
  return rows.length > 0;
}

/** Undoes a claim whose email did not go out, so a later run can try again. */
export async function releaseReminder(db: Db, bookingId: number): Promise<void> {
  await db.update(bookings).set({ reminderSentAt: null }).where(eq(bookings.id, bookingId));
}

/** Resend allows two requests a second; the loop leaves this gap between sends. */
export const SEND_PAUSE_MS = 500;

export type ReminderRunResult = {
  window: string;
  due: number;
  /** Delivered to Resend and stamped. */
  sent: string[];
  /** Resend refused; left unstamped so a retry today can pick them up. */
  failed: string[];
  /** No RESEND_API_KEY, so nothing went out and nothing was stamped. */
  skipped: string[];
};

export type RunReminderOptions = {
  /** The sender; injectable for tests. Defaults to Resend through sendBookingReminder. */
  send?: (booking: Booking, experience: Experience, now: Date) => Promise<SendResult>;
  /** Gap between two sends in ms; defaults to SEND_PAUSE_MS. */
  pauseMs?: number;
};

/**
 * Send what is due and record each one. A message Resend refuses, or that
 * could not be sent for want of a key, is left unmarked so a retry the same
 * day picks it up; a booking still unsent once its day arrives is simply out
 * of the window.
 */
export async function runReminders(now: Date = new Date(), opts: RunReminderOptions = {}): Promise<ReminderRunResult> {
  const send = opts.send ?? sendBookingReminder;
  const pauseMs = opts.pauseMs ?? SEND_PAUSE_MS;
  const db = await getDb();
  const due = await listDueReminders(db, now);
  const sent: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];
  let first = true;
  for (const { booking, experience } of due) {
    if (!(await claimReminder(db, booking.id, now))) continue;
    if (!first && pauseMs > 0) await new Promise((resolve) => setTimeout(resolve, pauseMs));
    first = false;
    const result = await send(booking, experience, now);
    if (result === "sent") {
      sent.push(booking.code);
      continue;
    }
    await releaseReminder(db, booking.id);
    (result === "skipped" ? skipped : failed).push(booking.code);
  }
  return { window: reminderWindow(now).dateISO, due: due.length, sent, failed, skipped };
}
