import { describe, expect, it } from "vitest";
import { applyLoad, buildSlotWindows, canFit, unitsFor, unitsInUse } from "@/lib/availability";
import { zonedToUtc } from "@/lib/time";

const DAY = "2026-10-14"; // Wednesday
const hours = { open: "11:00", close: "22:00" };
const early = new Date("2026-10-01T00:00:00Z"); // "now" long before the day

describe("unitsFor", () => {
  it("rounds guests up to units", () => {
    expect(unitsFor(1, 3)).toBe(1);
    expect(unitsFor(3, 3)).toBe(1);
    expect(unitsFor(4, 3)).toBe(2);
    expect(unitsFor(7, 3)).toBe(3);
    expect(unitsFor(0, 3)).toBe(1);
    expect(unitsFor(5, 1)).toBe(5);
  });
});

describe("buildSlotWindows", () => {
  it("offers every 30-min start where the duration fits before close", () => {
    const w = buildSlotWindows({ dateISO: DAY, durationMin: 60, hours, stepMin: 30, now: early, leadTimeMin: 60 });
    expect(w[0].time).toBe("11:00");
    expect(w[w.length - 1].time).toBe("21:00"); // 21:00 + 60 = 22:00 close
    expect(w).toHaveLength(21);
    const two = buildSlotWindows({ dateISO: DAY, durationMin: 120, hours, stepMin: 30, now: early, leadTimeMin: 60 });
    expect(two[two.length - 1].time).toBe("20:00");
  });

  it("hides slots inside the lead time and past slots", () => {
    const now = zonedToUtc(DAY, "14:15");
    const w = buildSlotWindows({ dateISO: DAY, durationMin: 60, hours, stepMin: 30, now, leadTimeMin: 60 });
    // Earliest start >= 15:15 → 15:30
    expect(w[0].time).toBe("15:30");
  });

  it("returns nothing on a closed day", () => {
    expect(buildSlotWindows({ dateISO: DAY, durationMin: 60, hours: null, now: early })).toEqual([]);
  });
});

describe("load and capacity", () => {
  const at = (t: string) => zonedToUtc(DAY, t);
  const load = [
    { startsAt: at("12:00"), endsAt: at("13:00"), units: 2 },
    { startsAt: at("12:30"), endsAt: at("14:30"), units: 1 },
    { startsAt: at("18:00"), endsAt: at("19:00"), units: 3 },
  ];

  it("counts overlapping units", () => {
    expect(unitsInUse(at("12:00"), at("12:30"), load)).toBe(2);
    expect(unitsInUse(at("12:30"), at("13:00"), load)).toBe(3);
    expect(unitsInUse(at("13:00"), at("14:00"), load)).toBe(1);
    expect(unitsInUse(at("15:00"), at("16:00"), load)).toBe(0);
    // Touching, not overlapping
    expect(unitsInUse(at("19:00"), at("20:00"), load)).toBe(0);
  });

  it("reports worst-case availability inside a slot", () => {
    const w = buildSlotWindows({ dateISO: DAY, durationMin: 60, hours, now: early });
    const slots = applyLoad(w, load, 3);
    const by = Object.fromEntries(slots.map((s) => [s.time, s.available]));
    expect(by["11:00"]).toBe(3);
    expect(by["11:30"]).toBe(1); // overlaps 12:00 (2 units) → 1 left
    expect(by["12:00"]).toBe(0); // 12:30-13:00 has 3 in use
    expect(by["13:00"]).toBe(2);
    expect(by["18:00"]).toBe(0);
    expect(by["19:00"]).toBe(3);
  });

  it("canFit checks the whole interval", () => {
    expect(canFit(at("11:30"), at("12:30"), 1, load, 3)).toBe(true);
    expect(canFit(at("11:30"), at("12:30"), 2, load, 3)).toBe(false);
    expect(canFit(at("13:00"), at("14:00"), 2, load, 3)).toBe(true);
    expect(canFit(at("13:00"), at("14:00"), 3, load, 3)).toBe(false);
    expect(canFit(at("17:30"), at("18:30"), 1, load, 3)).toBe(false);
  });
});
