/**
 * Every email the club sends: the confirmation (with a calendar file), the
 * cancellation, and the day-before reminder. Copy lives here as functions of
 * the booking so the text and HTML versions never disagree.
 *
 * The header is a PNG of the wordmark (Gmail strips inline SVG). Headlines
 * fall back to Georgia where Instrument Serif is not installed. Gold is used
 * for one rule only; small text stays ink on paper so it reads everywhere.
 * Reply-To is the desk, so a reply reaches a person.
 */
import type { Booking, Experience } from "@/lib/db/schema";
import { BOOKING, deskPhone, FACILITY, SITE } from "@/lib/config/site";
import { cancelWindowHours } from "@/lib/availability";
import { LATE_NO_SHOW_MIN, requirementsFor } from "@/lib/content/requirements";
import { buildIcs, googleCalendarUrl, type CalendarEvent } from "@/lib/ics";
import { formatInstant, formatMoney, labelForHHMM, toHHMMInTz } from "@/lib/time";

export type EmailMessage = {
  subject: string;
  text: string;
  html: string;
  /** Set on the reminder only. */
  headers?: Record<string, string>;
  attachments?: { filename: string; content: string; contentType: string }[];
};

/** Someone at the desk tonight, once the admin setting exists (brief item 3). */
export type HostOnDuty = { name: string; until?: string | null };

const INK = "#1d1d1f";
const MUTED = "#6e6e73";
const PAPER = "#fbfbfd";
const PAPER_2 = "#f5f5f7";
const GOLD = "#c9a55a";
const SERIF = "'Instrument Serif',Georgia,'Times New Roman',serif";
const SANS = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function origin(): string {
  return SITE.url.replace(/\/$/, "");
}

export function manageUrl(booking: Pick<Booking, "code">): string {
  return `${origin()}/reserve/confirmation/${booking.code}`;
}

export function fullAddress(): string {
  return `${SITE.address.line1}, ${SITE.address.city}, ${SITE.address.state} ${SITE.address.zip}`;
}

/** "5 minutes from the JFK terminals via the Van Wyck Expressway (I-678), Rockaway Blvd exit." */
export function drivingLine(): string {
  return `${FACILITY.transit.driveFromJfkMin} minutes from the JFK terminals via the ${FACILITY.transit.expressway}, ${FACILITY.transit.exit} exit.`;
}

/**
 * A lane tapped on a floor plan travels in the notes as "Lane 07 requested."
 * The notes field is also the guest's free text, so the number is only
 * honoured when it is a real lane (1 to FACILITY.laneCount) and the
 * experience actually uses a lane. Shared by the emails, the calendar file
 * and the confirmation page so they never disagree.
 */
export function requestedLane(notes: string | null | undefined, experience: Pick<Experience, "resource">): string | null {
  if (experience.resource !== "lane") return null;
  const m = /^Lane (\d{2}) requested\./.exec(notes ?? "");
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= FACILITY.laneCount ? m[1] : null;
}

/**
 * How to reach a person once online cancellation is closed: "call (718) 555-0100"
 * or, until the owner sets the number, "reply to this email". Reply-To is
 * the desk, so the fallback reaches the same people.
 */
function deskContact(capital = false): string {
  const phone = deskPhone();
  const phrase = phone ? `call ${phone}` : `reply to this email`;
  return capital ? phrase[0].toUpperCase() + phrase.slice(1) : phrase;
}

function paymentLine(booking: Booking): string {
  if (booking.amountCents === 0) return "Included with membership";
  const state = booking.paymentStatus === "paid" ? "paid" : booking.paymentStatus === "pay_on_arrival" ? "due on arrival" : booking.paymentStatus === "refunded" ? "refunded" : "pending";
  return `${formatMoney(booking.amountCents)}, ${state}`;
}

function bringLines(booking: Booking, experience: Experience): string[] {
  return requirementsFor(experience.eligibility as "handgun" | "longgun" | "simulator" | "anyone", Boolean(booking.memberId))
    .slice(0, 3)
    .map((r) => r.text);
}

function freeCancelCutoff(booking: Booking, experience: Experience): { hours: number; cutoff: Date } {
  const hours = cancelWindowHours(experience);
  return { hours, cutoff: new Date(booking.startsAt.getTime() - hours * 3_600_000) };
}

/**
 * The reservation as a calendar entry. Shared by the .ics attachment, the
 * download route and the Google link. `stamp` is when the file is made; the
 * "last hour to cancel free" alarm is only written while that hour is still
 * ahead, so a same-day booking never carries an alarm set in the past.
 */
export function calendarEventFor(booking: Booking, experience: Experience, stamp: Date = new Date()): CalendarEvent {
  const { hours, cutoff } = freeCancelCutoff(booking, experience);
  const alarmAt = new Date(cutoff.getTime() - 3_600_000);
  const lane = requestedLane(booking.notes, experience);
  const description = [
    `${experience.name} for ${booking.guests} guest${booking.guests === 1 ? "" : "s"}. Confirmation ${booking.code}.`,
    lane ? `Lane ${lane} requested; the desk confirms at check-in.` : null,
    "Arrive 15 minutes early for check-in and the safety briefing.",
    ...bringLines(booking, experience),
    `Manage: ${manageUrl(booking)}`,
  ]
    .filter((s): s is string => Boolean(s))
    .join("\n");
  return {
    uid: `${booking.code}@${SITE.domain}`,
    start: booking.startsAt,
    end: booking.endsAt,
    summary: `${experience.name} at ${SITE.name}`,
    description,
    location: `${SITE.name}, ${fullAddress()}`,
    url: manageUrl(booking),
    // Fires an hour before the free window closes, so "last hour" is true when it rings.
    ...(stamp < alarmAt ? { alarmHoursBefore: hours + 1, alarmTitle: "Last hour to cancel free" } : {}),
    stamp,
  };
}

export function icsFor(booking: Booking, experience: Experience, stamp?: Date): string {
  return buildIcs(calendarEventFor(booking, experience, stamp));
}

/** The Google link carries a short note; the full bring list lives in the .ics, so the URL stays readable in plain text. */
export function googleCalendarUrlFor(booking: Booking, experience: Experience): string {
  const ev = calendarEventFor(booking, experience);
  return googleCalendarUrl({ ...ev, description: `${experience.name} for ${booking.guests} guest${booking.guests === 1 ? "" : "s"}. Confirmation ${booking.code}. ${manageUrl(booking)}` });
}

/* ------------------------------------------------------------------------ */
/* HTML shell                                                                */
/* ------------------------------------------------------------------------ */

function button(href: string, label: string, kind: "primary" | "secondary" = "primary"): string {
  const style =
    kind === "primary"
      ? `display:inline-block;background:${INK};color:${PAPER};text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px;font-weight:500`
      : `display:inline-block;background:transparent;color:${INK};text-decoration:none;padding:11px 21px;border:1px solid rgba(29,29,31,.3);border-radius:999px;font-size:15px;font-weight:500`;
  return `<a href="${escape(href)}" style="${style}">${escape(label)}</a>`;
}

function row(label: string, value: string, mono = false): string {
  return `<tr>
    <td style="padding:8px 16px 8px 0;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${MUTED};vertical-align:top;white-space:nowrap">${escape(label)}</td>
    <td style="padding:8px 0;font-size:15px;color:${INK};vertical-align:top;${mono ? `font-family:${MONO};letter-spacing:.04em` : ""}">${escape(value)}</td>
  </tr>`;
}

function para(html: string, opts: { muted?: boolean; size?: number } = {}): string {
  return `<p style="margin:0 0 16px;font-size:${opts.size ?? 16}px;line-height:1.55;color:${opts.muted ? MUTED : INK}">${html}</p>`;
}

function shell(opts: { title: string; preheader: string; headline: string; body: string }): string {
  const mapHref = SITE.address.googleMapsUrl;
  const wordmark = `${origin()}/email/wordmark@2x.png`;
  const phone = deskPhone();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escape(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER_2};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${PAPER_2}">${escape(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER_2}">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${PAPER};border-radius:18px;font-family:${SANS}">
  <tr><td style="padding:32px 32px 0">
    <img src="${wordmark}" width="151" height="32" alt="Gun Spa" style="display:block;border:0;width:151px;height:32px">
  </td></tr>
  <tr><td style="padding:20px 32px 0"><div style="height:2px;line-height:2px;background:${GOLD};font-size:2px">&nbsp;</div></td></tr>
  <tr><td style="padding:28px 32px 36px;color:${INK}">
    <h1 style="font-family:${SERIF};font-weight:400;font-size:34px;line-height:1.1;letter-spacing:-.01em;margin:0 0 20px;color:${INK}">${escape(opts.headline)}</h1>
    ${opts.body}
  </td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;font-family:${SANS}">
  <tr><td style="padding:24px 32px 0;font-size:13px;line-height:1.6;color:${MUTED}">
    <a href="${escape(mapHref)}" style="color:${MUTED};text-decoration:underline">${escape(SITE.name)}, ${escape(fullAddress())}</a><br>
    ${phone ? `${escape(phone)}<br>` : ""}
    Reply to this email and a person at the desk answers.
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function textFooter(): string[] {
  return [``, `${SITE.name}`, fullAddress(), `Map: ${SITE.address.googleMapsUrl}`, deskPhone(), `Reply to this email and a person at the desk answers.`].filter((l): l is string => l !== null);
}

/* ------------------------------------------------------------------------ */
/* Confirmation                                                              */
/* ------------------------------------------------------------------------ */

export function confirmationText(booking: Booking, experience: Experience, opts: { host?: HostOnDuty | null; now?: Date } = {}): EmailMessage {
  const now = opts.now ?? new Date();
  const when = formatInstant(booking.startsAt);
  const guests = `${booking.guests} guest${booking.guests === 1 ? "" : "s"}`;
  const url = manageUrl(booking);
  const gcal = googleCalendarUrlFor(booking, experience);
  const lane = requestedLane(booking.notes, experience);
  const laneLine = lane ? `Lane ${lane}, ${labelForHHMM(toHHMMInTz(booking.startsAt))}. Requested; the desk confirms at check-in.` : null;
  const { hours, cutoff } = freeCancelCutoff(booking, experience);
  // A lane booked two hours out is already inside the 24-hour window, so never promise a cutoff that has passed.
  const cancelOpen = now < cutoff;
  const cancelLine = cancelOpen
    ? `Free cancellation until ${formatInstant(cutoff)}, ${hours} hours before you start. After that, ${deskContact()} and the desk will sort it out.`
    : `Online cancellation has already closed for this reservation. If plans change, ${deskContact()} and the desk will sort it out.`;
  const calendarLine = cancelOpen
    ? `The attached calendar file puts this on your phone, with a nudge an hour before the free cancellation window closes.`
    : `The attached calendar file puts this on your phone.`;
  const hostLine = opts.host?.name ? `Tonight's host: ${opts.host.name}${opts.host.until ? `, until ${opts.host.until}` : ""}.` : null;
  const bring = bringLines(booking, experience);
  const subject = `Your reservation at ${SITE.name}: ${booking.code}`;

  const text = [
    `Your reservation is set, ${booking.firstName}.`,
    ``,
    `${experience.name}`,
    `${when}, ${experience.durationMin} minutes`,
    guests,
    laneLine,
    `Total: ${paymentLine(booking)}`,
    `Confirmation code: ${booking.code}`,
    ``,
    `The attached calendar file puts this on your phone. Google Calendar: ${gcal}`,
    ``,
    `Bring a valid government photo ID. Arrive 15 minutes early for check-in and the safety briefing.`,
    ...bring.map((b) => `- ${b}`),
    ``,
    `Doors: ${fullAddress()}. ${drivingLine()}`,
    hostLine,
    ``,
    cancelLine,
    `Manage this reservation: ${url}`,
    ...textFooter(),
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const body = [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-top:1px solid rgba(29,29,31,.12);border-bottom:1px solid rgba(29,29,31,.12);margin:0 0 24px">
      ${row("What", experience.name)}
      ${row("When", `${when}, ${experience.durationMin} minutes`)}
      ${row("Guests", guests)}
      ${laneLine ? row("Lane", laneLine) : ""}
      ${row("Total", paymentLine(booking))}
      ${row("Code", booking.code, true)}
    </table>`,
    `<p style="margin:0 0 28px">${button(url, "Manage reservation")} &nbsp; ${button(gcal, "Add to Google Calendar", "secondary")}</p>`,
    para(escape(calendarLine), { muted: true, size: 14 }),
    para(`<strong>Bring a valid government photo ID.</strong> Arrive 15 minutes early for check-in and the safety briefing.`),
    `<ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.55;color:${INK}">${bring.map((b) => `<li style="margin:0 0 6px">${escape(b)}</li>`).join("")}</ul>`,
    para(`<strong>Doors:</strong> <a href="${escape(SITE.address.googleMapsUrl)}" style="color:${INK}">${escape(fullAddress())}</a>. ${escape(drivingLine())}`),
    hostLine ? para(escape(hostLine)) : "",
    para(escape(cancelLine), { muted: true, size: 14 }),
  ].join("\n");

  const html = shell({ title: subject, preheader: `${experience.name}, ${when}. Code ${booking.code}.`, headline: `Your reservation is set, ${booking.firstName}.`, body });
  return {
    subject,
    text,
    html,
    attachments: [{ filename: `gun-spa-${booking.code}.ics`, content: icsFor(booking, experience, now), contentType: "text/calendar; charset=utf-8; method=PUBLISH" }],
  };
}

/* ------------------------------------------------------------------------ */
/* Cancellation                                                              */
/* ------------------------------------------------------------------------ */

export type CancellationReason = "guest" | "expired";

export function cancellationText(booking: Booking, experience: Experience, reason: CancellationReason): EmailMessage {
  const when = formatInstant(booking.startsAt);
  const reserve = `${origin()}/reserve`;
  const subject = reason === "expired" ? `Your hold at ${SITE.name} was released: ${booking.code}` : `Your reservation at ${SITE.name} is cancelled: ${booking.code}`;
  const headline = reason === "expired" ? "We released your hold." : "Reservation cancelled.";
  const lead =
    reason === "expired"
      ? `Payment for ${experience.name} on ${when} did not complete within ${BOOKING.pendingHoldMin} minutes, so the time went back on the calendar. Nothing was charged.`
      : `${experience.name} on ${when} is cancelled, ${booking.firstName}. The time is back on the calendar.`;
  const money =
    reason === "expired" || booking.amountCents === 0
      ? null
      : booking.paymentStatus === "refunded"
        ? `Stripe has been asked to return ${formatMoney(booking.amountCents)} to your card. How soon it shows depends on your bank.`
        : booking.paymentStatus === "paid"
          ? `Your card was charged ${formatMoney(booking.amountCents)}. The desk will settle the refund; reply here if it has not landed in a week.`
          : `Nothing was charged.`;
  const again = reason === "expired" ? "If you still want the time, book it again. The calendar may still have it." : "When you are ready to come back, the calendar is open.";

  const text = [headline, ``, lead, money, ``, again, `Reserve: ${reserve}`, ...textFooter()].filter((l): l is string => l !== null).join("\n");
  const body = [para(escape(lead)), money ? para(escape(money)) : "", para(escape(again), { muted: true, size: 14 }), `<p style="margin:0">${button(reserve, reason === "expired" ? "Reserve again" : "Make another reservation")}</p>`].join("\n");
  const html = shell({ title: subject, preheader: lead, headline, body });
  return { subject, text, html };
}

/* ------------------------------------------------------------------------ */
/* Reminder                                                                  */
/* ------------------------------------------------------------------------ */

export function reminderText(booking: Booking, experience: Experience, now: Date = new Date()): EmailMessage {
  const startLabel = labelForHHMM(toHHMMInTz(booking.startsAt));
  const when = formatInstant(booking.startsAt);
  const url = manageUrl(booking);
  const lane = requestedLane(booking.notes, experience);
  const guests = `${booking.guests} guest${booking.guests === 1 ? "" : "s"}`;
  const { cutoff } = freeCancelCutoff(booking, experience);
  const cancelLine =
    now < cutoff
      ? `Plans changed? Free cancellation is open until ${formatInstant(cutoff)}. After that, ${deskContact()} and the desk will sort it out.`
      : `Plans changed? Online cancellation has closed for this reservation. ${deskContact(true)} and the desk will sort it out.`;
  const lateLine = `Arrive 15 minutes early for check-in and the safety briefing. More than ${LATE_NO_SHOW_MIN} minutes late counts as a no-show.`;
  const bring = bringLines(booking, experience);
  const subject = `Tomorrow at ${startLabel}: ${experience.name} at ${SITE.name}`;
  const headline = `Tomorrow at ${startLabel}, ${booking.firstName}.`;

  const text = [
    headline,
    ``,
    `${experience.name}, ${when}, ${guests}.`,
    lane ? `Lane ${lane} requested; the desk confirms at check-in.` : null,
    `Confirmation code: ${booking.code}`,
    ``,
    `Doors: ${fullAddress()}. ${drivingLine()}`,
    `Map: ${SITE.address.googleMapsUrl}`,
    ``,
    `Bring a valid government photo ID. ${lateLine}`,
    ...bring.map((b) => `- ${b}`),
    ``,
    cancelLine,
    `Manage this reservation: ${url}`,
    ``,
    `To stop reminders for this reservation, reply with the word STOP.`,
    ...textFooter(),
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const body = [
    para(`${escape(experience.name)}, ${escape(when)}, ${guests}.${lane ? ` Lane ${lane} requested; the desk confirms at check-in.` : ""} Code <span style="font-family:${MONO};letter-spacing:.04em">${booking.code}</span>.`),
    para(`<strong>Doors:</strong> <a href="${escape(SITE.address.googleMapsUrl)}" style="color:${INK}">${escape(fullAddress())}</a>. ${escape(drivingLine())}`),
    para(`<strong>Bring a valid government photo ID.</strong> ${escape(lateLine)}`),
    `<ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.55;color:${INK}">${bring.map((b) => `<li style="margin:0 0 6px">${escape(b)}</li>`).join("")}</ul>`,
    para(escape(cancelLine), { muted: true, size: 14 }),
    `<p style="margin:0 0 24px">${button(url, "Manage reservation")} &nbsp; ${button(SITE.address.googleMapsUrl, "Directions", "secondary")}</p>`,
    para(`To stop reminders for this reservation, reply with the word STOP.`, { muted: true, size: 13 }),
  ].join("\n");

  const html = shell({ title: subject, preheader: `${experience.name} at ${startLabel} tomorrow. Bring ID.`, headline, body });
  const unsubscribe = `mailto:${SITE.email}?subject=${encodeURIComponent(`STOP reminders ${booking.code}`)}`;
  return { subject, text, html, headers: { "List-Unsubscribe": `<${unsubscribe}>` } };
}

/* ------------------------------------------------------------------------ */
/* Sending                                                                   */
/* ------------------------------------------------------------------------ */

/**
 * "sent": Resend accepted the message. "skipped": no RESEND_API_KEY, so it
 * was logged instead and nothing should be recorded as delivered. "refused":
 * Resend or the network said no.
 */
export type SendResult = "sent" | "skipped" | "refused";

export type SendOptions = {
  /** Handed to Resend as Idempotency-Key, so a retried webhook cannot mail the guest twice. */
  idempotencyKey?: string;
};

/**
 * Resend reads attachment content as bytes (a Buffer or base64), not as
 * text. The message keeps the .ics as the string the tests and the download
 * route read; the bytes are made here, at the edge.
 */
export function toResendAttachments(attachments: NonNullable<EmailMessage["attachments"]>): { filename: string; content: Buffer; contentType: string }[] {
  return attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content, "utf8"), contentType: a.contentType }));
}

/** Resend allows two requests a second; a 429 is retried once after this pause. */
const RATE_LIMIT_RETRY_MS = 1100;

/** Never throws; email failures must not break a reservation. */
export async function sendEmail(kind: "confirmation" | "cancellation" | "reminder", to: string, msg: EmailMessage, opts: SendOptions = {}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "test") console.info(`[email] RESEND_API_KEY not set; would send ${kind} "${msg.subject}" to ${to}`);
    return "skipped";
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const bcc = process.env.EMAIL_BCC;
    const payload = {
      from: process.env.EMAIL_FROM ?? `${SITE.name} <reservations@${SITE.domain}>`,
      to,
      replyTo: SITE.email,
      ...(bcc ? { bcc } : {}),
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      ...(msg.headers ? { headers: msg.headers } : {}),
      ...(msg.attachments ? { attachments: toResendAttachments(msg.attachments) } : {}),
      tags: [{ name: "kind", value: kind }],
    };
    const requestOptions = opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : undefined;
    let { error } = await resend.emails.send(payload, requestOptions);
    if (error?.name === "rate_limit_exceeded") {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
      ({ error } = await resend.emails.send(payload, requestOptions));
    }
    if (error) {
      console.error(`[email] resend refused ${kind} for ${to}`, error);
      return "refused";
    }
    return "sent";
  } catch (err) {
    console.error(`[email] failed to send ${kind}`, err);
    return "refused";
  }
}

export async function sendBookingConfirmation(booking: Booking, experience: Experience, opts: { host?: HostOnDuty | null; now?: Date } & SendOptions = {}): Promise<SendResult> {
  const { idempotencyKey, ...text } = opts;
  return sendEmail("confirmation", booking.email, confirmationText(booking, experience, text), { idempotencyKey });
}

export async function sendBookingCancellation(booking: Booking, experience: Experience, reason: CancellationReason, opts: SendOptions = {}): Promise<SendResult> {
  return sendEmail("cancellation", booking.email, cancellationText(booking, experience, reason), opts);
}

export async function sendBookingReminder(booking: Booking, experience: Experience, now: Date = new Date()): Promise<SendResult> {
  return sendEmail("reminder", booking.email, reminderText(booking, experience, now));
}
