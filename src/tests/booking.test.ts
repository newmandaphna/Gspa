import { beforeAll, describe, expect, it } from "vitest";

process.env.PGLITE_DATA_DIR = "memory://";
delete process.env.DATABASE_URL;

import { cancelBooking, createBooking, getAvailability, getBookingByCode, listBookings, markPaidBySession, attachStripeSession } from "@/lib/booking";
import { CATALOG } from "@/lib/content/catalog";
import { RESOURCES } from "@/lib/config/site";
import { addDaysIso, todayIso, zonedToUtc } from "@/lib/time";

const NOW = new Date("2026-10-05T14:00:00Z"); // Monday 10:00 AM New York (EDT)
const DAY = addDaysIso(todayIso(undefined, NOW), 3); // Thursday
const lane = CATALOG.find((c) => c.bookable && c.resource === "lane")!;

const base = {
  experienceSlug: lane.slug,
  date: DAY,
  guests: 2,
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+1 718 555 0100",
  ackRequirements: true,
  paymentMode: "on_arrival" as const,
  now: NOW,
};

describe("booking lifecycle (in-memory Postgres)", () => {
  beforeAll(async () => {
    const a = await getAvailability(lane.slug, DAY, { now: NOW });
    expect(a?.open).toBe(true);
  });

  it("creates a confirmed pay-on-arrival reservation and reduces availability", async () => {
    const before = await getAvailability(lane.slug, DAY, { now: NOW });
    const slot = before!.slots[2];
    const res = await createBooking({ ...base, time: slot.time });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.booking.code).toMatch(/^GS-[A-Z2-9]{6}$/);
    expect(res.booking.status).toBe("confirmed");
    expect(res.booking.paymentStatus).toBe("pay_on_arrival");
    expect(res.booking.units).toBe(1);
    expect(res.booking.amountCents).toBe(lane.priceCents);
    expect(res.booking.startsAt.toISOString()).toBe(zonedToUtc(DAY, slot.time).toISOString());

    const after = await getAvailability(lane.slug, DAY, { now: NOW });
    const s = after!.slots.find((x) => x.time === slot.time)!;
    expect(s.available).toBe(RESOURCES.lane.capacity - 1);
  });

  it("splits large parties into multiple units and caps them", async () => {
    const slot = "15:00";
    const perUnit = lane.maxGuestsPerUnit;
    const res = await createBooking({ ...base, time: slot, guests: perUnit * 2 + 1, email: "party@example.com" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.booking.units).toBe(3);
    const tooMany = await createBooking({ ...base, time: slot, guests: perUnit * (lane.maxUnitsPerBooking + 1), email: "big@example.com" });
    expect(tooMany.ok).toBe(false);
    if (!tooMany.ok) expect(tooMany.code).toBe("TOO_MANY");
  });

  it("refuses to overbook the resource", async () => {
    const slot = "19:00";
    const cap = RESOURCES.lane.capacity;
    for (let i = 0; i < cap; i++) {
      const r = await createBooking({ ...base, time: slot, guests: 1, email: `g${i}@example.com` });
      expect(r.ok).toBe(true);
    }
    const full = await createBooking({ ...base, time: slot, guests: 1, email: "late@example.com" });
    expect(full.ok).toBe(false);
    if (!full.ok) expect(full.code).toBe("UNAVAILABLE");
    // Overlapping start 30 minutes later is also blocked (worst-case within interval)
    const overlap = await createBooking({ ...base, time: "19:30", guests: 1, email: "late2@example.com" });
    expect(overlap.ok).toBe(false);
    const avail = await getAvailability(lane.slug, DAY, { now: NOW });
    expect(avail!.slots.find((s) => s.time === slot)!.available).toBe(0);
  });

  it("rejects invalid dates, times, past dates and dates beyond the window", async () => {
    expect((await createBooking({ ...base, time: "25:00" })).ok).toBe(false);
    expect((await createBooking({ ...base, date: "2020-01-01", time: "12:00" })).ok).toBe(false);
    const far = addDaysIso(todayIso(undefined, NOW), 45);
    const tooFar = await createBooking({ ...base, date: far, time: "12:00" });
    expect(tooFar.ok).toBe(false);
    // A typed member number only counts when it belongs to a real, active member (see members.test.ts).
    const fakeMember = await createBooking({ ...base, date: far, time: "12:00", memberNumber: "GS-M-424242" });
    expect(fakeMember.ok).toBe(false);
    // Not on a slot boundary / inside lead time
    expect((await createBooking({ ...base, time: "12:07" })).ok).toBe(false);
    const today = todayIso(undefined, NOW);
    expect((await createBooking({ ...base, date: today, time: "10:30" })).ok).toBe(false);
  });

  it("supports the Stripe pending → paid path and hold expiry", async () => {
    const res = await createBooking({ ...base, time: "13:00", paymentMode: "stripe", email: "card@example.com" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.booking.status).toBe("pending");
    await attachStripeSession(res.booking.id, "cs_test_123");
    const paid = await markPaidBySession("cs_test_123", "pi_123");
    expect(paid?.status).toBe("confirmed");
    expect(paid?.paymentStatus).toBe("paid");

    // An unpaid hold older than the hold window frees its slot.
    const stale = await createBooking({ ...base, time: "13:30", paymentMode: "stripe", email: "stale@example.com", now: new Date(NOW.getTime() - 60 * 60_000) });
    expect(stale.ok).toBe(true);
    const later = await getAvailability(lane.slug, DAY, { now: NOW });
    const s = later!.slots.find((x) => x.time === "13:30")!;
    const fresh = await getBookingByCode(stale.ok ? stale.booking.code : "");
    expect(fresh?.booking.status).toBe("cancelled");
    expect(s.available).toBeGreaterThanOrEqual(RESOURCES.lane.capacity - 1);
  });

  it("lets guests cancel with a matching email inside the policy window", async () => {
    const res = await createBooking({ ...base, time: "17:00", email: "cancel@example.com" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const wrong = await cancelBooking(res.booking.code, { email: "other@example.com", now: NOW });
    expect(wrong.ok).toBe(false);
    const late = await cancelBooking(res.booking.code, { email: "cancel@example.com", now: new Date(res.booking.startsAt.getTime() - 60 * 60_000) });
    expect(late.ok).toBe(false);
    const ok = await cancelBooking(res.booking.code, { email: "CANCEL@example.com", now: NOW });
    expect(ok.ok).toBe(true);
    const rows = await listBookings({ from: zonedToUtc(DAY, "00:00"), to: zonedToUtc(addDaysIso(DAY, 1), "00:00") });
    expect(rows.some((r) => r.booking.code === res.booking.code)).toBe(false);
  });
});
