/**
 * iCalendar (RFC 5545) output for a reservation, with zero dependencies.
 *
 * One VCALENDAR, one VEVENT, times written in the club's own zone with a
 * VTIMEZONE block for America/New_York so Apple, Google and Outlook all put
 * the session at the right wall-clock hour whatever zone the phone is in.
 * The same fields feed a Google Calendar "add" link for people who would
 * rather tap than download.
 */
import { SITE } from "@/lib/config/site";
import { RANGE_TZ, toHHMMInTz, toIsoDateInTz } from "@/lib/time";

export type CalendarEvent = {
  /** Stable id; the same uid re-imported updates rather than duplicates. */
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
  url?: string;
  /** Show a reminder this many hours before the start. */
  alarmHoursBefore?: number;
  alarmTitle?: string;
  /** DTSTAMP; defaults to now. Injectable so tests are stable. */
  stamp?: Date;
};

const CRLF = "\r\n";

/** Backslash, semicolon, comma and newlines are special in TEXT values. */
export function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** RFC 5545 3.1: lines longer than 75 octets fold onto a following line that starts with a space. */
export function foldLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  let width = 75;
  while (i < bytes.length) {
    let end = Math.min(i + width, bytes.length);
    // Never split inside a multi-byte character: back up to a byte that starts one.
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    out.push(bytes.subarray(i, end).toString("utf8"));
    i = end;
    width = 74; // the continuation space takes one octet
  }
  return out.join(`${CRLF} `);
}

/** "20261008T203000" for an instant as wall-clock time in `tz`. */
export function localStamp(date: Date, tz: string = RANGE_TZ): string {
  return `${toIsoDateInTz(date, tz).replace(/-/g, "")}T${toHHMMInTz(date, tz).replace(":", "")}00`;
}

/** "20261009T003000Z": the same instant in UTC. */
export function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/**
 * America/New_York, as the rules have stood since 2007: second Sunday in
 * March to the first Sunday in November. Written once here rather than
 * computed so the block is byte-stable for tests and for calendar clients
 * that compare it.
 */
export const VTIMEZONE_NEW_YORK = [
  "BEGIN:VTIMEZONE",
  "TZID:America/New_York",
  "X-LIC-LOCATION:America/New_York",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:-0500",
  "TZOFFSETTO:-0400",
  "TZNAME:EDT",
  "DTSTART:19700308T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:-0400",
  "TZOFFSETTO:-0500",
  "TZNAME:EST",
  "DTSTART:19701101T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function buildIcs(ev: CalendarEvent): string {
  const stamp = ev.stamp ?? new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE.name}//Reservations//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE_NEW_YORK,
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `DTSTAMP:${utcStamp(stamp)}`,
    `DTSTART;TZID=${RANGE_TZ}:${localStamp(ev.start)}`,
    `DTEND;TZID=${RANGE_TZ}:${localStamp(ev.end)}`,
    `SUMMARY:${escapeText(ev.summary)}`,
  ];
  if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`);
  if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`);
  if (ev.url) lines.push(`URL:${ev.url}`);
  lines.push("STATUS:CONFIRMED", "TRANSP:OPAQUE");
  if (ev.alarmHoursBefore && ev.alarmHoursBefore > 0) {
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapeText(ev.alarmTitle ?? "Reminder")}`, `TRIGGER:-PT${Math.round(ev.alarmHoursBefore)}H`, "END:VALARM");
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(foldLine).join(CRLF) + CRLF;
}

/** A Google Calendar "add this event" link built from the same fields. */
export function googleCalendarUrl(ev: Pick<CalendarEvent, "start" | "end" | "summary" | "description" | "location">): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.summary,
    dates: `${utcStamp(ev.start)}/${utcStamp(ev.end)}`,
    ctz: RANGE_TZ,
  });
  if (ev.description) params.set("details", ev.description);
  if (ev.location) params.set("location", ev.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
