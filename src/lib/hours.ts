/**
 * Open or closed right now, computed from HOURS in the club's timezone.
 * One function feeds the nav dot, the footer line, the hours table and any
 * hero line, so every surface agrees on whether the doors are open.
 * Pure: pass `now` in and it works on the server and in the browser alike.
 */
import { HOURS, SITE } from "@/lib/config/site";
import { addDaysIso, dayOfWeekIso, labelForHHMM, toHHMMInTz, todayIso } from "@/lib/time";

export type OpenStatus = {
  /** Day of week in the club's timezone, 0 = Sunday. */
  dow: number;
  open: boolean;
  /** Short chrome line: "Open until 10 PM", "Opens 10 AM tomorrow", "Opens 9 AM Saturday". */
  short: string;
  /** Full sentence for the hours table: "Open now until 10 PM", "Closed for tonight. Opens at 10 AM tomorrow". */
  long: string;
  /** "Open tonight until 10." for a hero, or "Opens tomorrow at 10." when closed. */
  hero: string;
};

/** "10 PM" becomes "10" for running copy; "10:30 PM" stays "10:30". */
function bare(hhmm: string): string {
  return labelForHHMM(hhmm).replace(/ [AP]M$/, "");
}

function weekdayName(dateISO: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(`${dateISO}T00:00:00Z`));
}

export function computeOpenStatus(now: Date = new Date()): OpenStatus {
  const tz = SITE.timezone;
  const today = todayIso(tz, now);
  const dow = dayOfWeekIso(today);
  const hhmm = toHHMMInTz(now, tz);
  const h = HOURS[dow];

  if (h && hhmm >= h.open && hhmm < h.close) {
    const until = labelForHHMM(h.close);
    return { dow, open: true, short: `Open until ${until}`, long: `Open now until ${until}`, hero: `Open tonight until ${bare(h.close)}.` };
  }

  // Not open now: find the next opening, today (before open) or on a later day.
  if (h && hhmm < h.open) {
    const at = labelForHHMM(h.open);
    return { dow, open: false, short: `Opens ${at} today`, long: `Opens at ${at}`, hero: `Opens today at ${bare(h.open)}.` };
  }
  for (let i = 1; i <= 7; i++) {
    const iso = addDaysIso(today, i);
    const next = HOURS[dayOfWeekIso(iso)];
    if (next) {
      const when = i === 1 ? "tomorrow" : weekdayName(iso);
      const at = labelForHHMM(next.open);
      const lead = h ? "Closed for tonight" : "Closed today";
      return { dow, open: false, short: `Opens ${at} ${when}`, long: `${lead}. Opens at ${at} ${when}`, hero: `Opens ${when} at ${bare(next.open)}.` };
    }
  }
  return { dow, open: false, short: "Closed", long: "Closed", hero: "Closed." };
}
