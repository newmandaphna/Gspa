import { describe, expect, it } from "vitest";
import { addDaysIso, dayOfWeekIso, isIsoDate, labelForHHMM, toHHMMInTz, toIsoDateInTz, zonedToUtc } from "@/lib/time";

describe("time", () => {
  it("converts New York wall time to UTC across DST", () => {
    // EST (UTC-5) in January
    expect(zonedToUtc("2026-01-15", "10:00").toISOString()).toBe("2026-01-15T15:00:00.000Z");
    // EDT (UTC-4) in July
    expect(zonedToUtc("2026-07-15", "10:00").toISOString()).toBe("2026-07-15T14:00:00.000Z");
    // DST starts 2026-03-08 02:00 → 03:00; 10:00 that day is EDT
    expect(zonedToUtc("2026-03-08", "10:00").toISOString()).toBe("2026-03-08T14:00:00.000Z");
    // 01:00 that day is still EST
    expect(zonedToUtc("2026-03-08", "01:00").toISOString()).toBe("2026-03-08T06:00:00.000Z");
  });

  it("round-trips instants back to New York date and time", () => {
    const d = zonedToUtc("2026-11-01", "23:30");
    expect(toIsoDateInTz(d)).toBe("2026-11-01");
    expect(toHHMMInTz(d)).toBe("23:30");
    // Midnight handling
    const m = zonedToUtc("2026-05-05", "00:00");
    expect(toHHMMInTz(m)).toBe("00:00");
    expect(toIsoDateInTz(m)).toBe("2026-05-05");
  });

  it("validates ISO dates", () => {
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("26-01-01")).toBe(false);
  });

  it("does calendar arithmetic", () => {
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
    expect(dayOfWeekIso("2026-09-24")).toBe(4); // Thursday
    expect(labelForHHMM("13:30")).toBe("1:30 PM");
    expect(labelForHHMM("00:00")).toBe("12 AM");
    expect(labelForHHMM("12:00")).toBe("12 PM");
  });
});
