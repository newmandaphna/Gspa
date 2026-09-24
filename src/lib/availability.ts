import { BOOKING, HOURS, type Hours } from "@/lib/config/site";
import { dayOfWeekIso, fromMinutes, labelForHHMM, toMinutes, zonedToUtc, RANGE_TZ } from "@/lib/time";

export type SlotWindow = { time: string; startsAt: Date; endsAt: Date };
export type Slot = SlotWindow & { label: string; available: number };
export type Load = { startsAt: Date; endsAt: Date; units: number };

export function hoursFor(dateISO: string, hours: Record<number, Hours> = HOURS): Hours {
  return hours[dayOfWeekIso(dateISO)] ?? null;
}

/** ceil(guests / perUnit), min 1. */
export function unitsFor(guests: number, maxGuestsPerUnit: number): number {
  if (guests < 1) return 1;
  return Math.max(1, Math.ceil(guests / Math.max(1, maxGuestsPerUnit)));
}

/**
 * All slot windows for a date, ignoring load. A slot is offered when the full
 * duration fits before close and the start is at least `leadTimeMin` from now.
 */
export function buildSlotWindows(opts: {
  dateISO: string;
  durationMin: number;
  hours?: Hours;
  stepMin?: number;
  now?: Date;
  leadTimeMin?: number;
  tz?: string;
}): SlotWindow[] {
  const hours = opts.hours === undefined ? hoursFor(opts.dateISO) : opts.hours;
  if (!hours) return [];
  const step = opts.stepMin ?? BOOKING.slotStepMin;
  const lead = opts.leadTimeMin ?? BOOKING.leadTimeMin;
  const now = opts.now ?? new Date();
  const tz = opts.tz ?? RANGE_TZ;
  const open = toMinutes(hours.open);
  const close = toMinutes(hours.close);
  const earliest = now.getTime() + lead * 60_000;
  const out: SlotWindow[] = [];
  for (let m = open; m + opts.durationMin <= close; m += step) {
    const time = fromMinutes(m);
    const startsAt = zonedToUtc(opts.dateISO, time, tz);
    if (startsAt.getTime() < earliest) continue;
    const endsAt = new Date(startsAt.getTime() + opts.durationMin * 60_000);
    out.push({ time, startsAt, endsAt });
  }
  return out;
}

/** Units in use during [start, end) given existing load. */
export function unitsInUse(start: Date, end: Date, load: Load[]): number {
  let used = 0;
  for (const b of load) {
    if (b.startsAt < end && b.endsAt > start) used += b.units;
  }
  return used;
}

/** Attach remaining-unit counts to each slot window. */
export function applyLoad(windows: SlotWindow[], load: Load[], capacity: number): Slot[] {
  return windows.map((w) => {
    const used = unitsInUse(w.startsAt, w.endsAt, load);
    // Overlap within a slot can vary by sub-interval; take the worst case at
    // every slot boundary inside the window.
    let worst = used;
    for (const b of load) {
      if (b.startsAt > w.startsAt && b.startsAt < w.endsAt) {
        const probeEnd = new Date(b.startsAt.getTime() + 1);
        worst = Math.max(worst, unitsInUse(b.startsAt, probeEnd, load));
      }
    }
    return { ...w, label: labelForHHMM(w.time), available: Math.max(0, capacity - worst) };
  });
}

/**
 * Whether a booking that needs `units` can start at `start` for `duration`.
 * Checks the maximum concurrent usage across the whole interval, not just
 * the start instant.
 */
export function canFit(start: Date, end: Date, units: number, load: Load[], capacity: number): boolean {
  const probes = [start.getTime()];
  for (const b of load) {
    if (b.startsAt > start && b.startsAt < end) probes.push(b.startsAt.getTime());
  }
  for (const t of probes) {
    const used = unitsInUse(new Date(t), new Date(t + 1), load);
    if (used + units > capacity) return false;
  }
  return true;
}

/** Latest bookable date for a public guest or a member. */
export function maxBookableDate(todayISO: string, isMember: boolean): string {
  const days = isMember ? BOOKING.memberMaxAdvanceDays : BOOKING.maxAdvanceDays;
  const [y, mo, d] = todayISO.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d + days)).toISOString().slice(0, 10);
}
