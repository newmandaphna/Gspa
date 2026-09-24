/**
 * The day-before reminder. The hourly scheduled run (GET /api/cron/run) mails
 * every confirmed reservation that is about a day away and has not been
 * reminded yet. The window rolls with the clock instead of naming a calendar
 * day: a booking is due from 25 hours before it starts down to 12 hours
 * before, so hourly runs reach it on the first run inside that span (24 to
 * 25 hours ahead) and a run that was missed, even for half a day, still finds
 * it on the next one. A reservation made less than a day before it starts
 * has just had its confirmation and is not reminded again.
 *
 * `reminder_sent_at` is the claim as well as the record: a row is stamped
 * before its email goes out, only if it was still unstamped, so two
 * overlapping runs (a slow first request and its retry) cannot both mail the
 * same guest, and every later hourly run sees it stamped and leaves it be. A
 * send that does not go through clears the stamp again.
 */
import { and, asc, eq, gte, isNull, lt, lte, sql } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db";
import { ensureSchema } from "@/lib/db/migrate";
import { bookings, experiences, type Booking, type Experience } from "@/lib/db/schema";
import { sendBookingReminder, type SendResult } from "@/lib/email";

const HOUR_MS = 3_600_000;

/** A booking becomes due once it is this close: the first hourly run inside the span mails it. */
export const REMINDER_LEAD_MAX_HOURS = 25;
/** A booking stops being due this close to its start; runs missed for up to 13 hours still catch it. */
export const REMINDER_LEAD_MIN_HOURS = 12;
/** Only reservations made at least this long before they start get a day-before reminder. */
export const REMINDER_MIN_NOTICE_HOURS = 24;

export type ReminderWindow = { from: Date; to: Date; label: string };

/** The start times that are due at `now`: a UTC interval [from, to), 12 to 25 hours ahead. */
export function reminderWindow(now: Date = new Date()): ReminderWindow {
  const from = new Date(now.getTime() + REMINDER_LEAD_MIN_HOURS * HOUR_MS);
  const to = new Date(now.getTime() + REMINDER_LEAD_MAX_HOURS * HOUR_MS);
  return { from, to, label: `${from.toISOString()}/${to.toISOString()}` };
}

export type ReminderRow = { booking: Booking; experience: Experience };

/** Confirmed, starting 12 to 25 hours from now, made a day or more ahead, not yet reminded. Earliest first. */
export async function listDueReminders(db: Db, now: Date = new Date()): Promise<ReminderRow[]> {
  const { from, to } = reminderWindow(now);
  const notice = sql`${bookings.startsAt} - make_interval(hours => ${REMINDER_MIN_NOTICE_HOURS})`;
  const query = () =>
    db
      .select({ booking: bookings, experience: experiences })
      .from(bookings)
      .innerJoin(experiences, eq(bookings.experienceId, experiences.id))
      .where(
        and(
          eq(bookings.status, "confirmed"),
          gte(bookings.startsAt, from),
          lt(bookings.startsAt, to),
          lte(bookings.createdAt, notice),
          isNull(bookings.reminderSentAt),
        ),
      )
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
  /** The UTC interval of start times this run covered, as "from/to". */
  window: string;
  due: number;
  /** Delivered to Resend and stamped. */
  sent: string[];
  /** Resend refused; left unstamped so the next hourly run can pick them up. */
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
 * could not be sent for want of a key, is left unmarked so the next hourly
 * run picks it up; a booking still unsent once it is under 12 hours away is
 * simply out of the window.
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
  return { window: reminderWindow(now).label, due: due.length, sent, failed, skipped };
}
