import { describe, expect, it } from "vitest";
import { PRICE_PENDING, PRICES_PUBLIC } from "@/lib/pricing";
import { upcomingClasses, classDateRange, classPrice, canEnroll, type PublicClassSession } from "@/lib/public-classes";

describe("public upcoming classes", () => {
  const session = (id: number, status = "open", startsAt = `2099-01-0${id}T12:00:00Z`) => ({ id, status, startsAt });
  it("filters past, started, draft and cancelled sessions, sorts chronologically and limits to three", () => {
    const now = Date.parse("2099-01-01T12:00:00Z");
    expect(upcomingClasses([session(5), session(1), session(3, "closed"), session(4), session(2), session(6, "draft"), session(7, "cancelled"), session(8, "open", "2020-01-01")], now, 3).map(s => s.id)).toEqual([2, 3, 4]);
  });
  it("shows New York start and end dates across midnight and free pricing", () => {
    const range = classDateRange({ startsAt: "2099-01-02T04:00:00Z", endsAt: "2099-01-02T07:00:00Z" });
    // 04:00 to 07:00 UTC is 11 PM to 2 AM in New York, across midnight.
    expect(range).toBe("Thu, Jan 1, 11 PM to Fri, Jan 2, 2 AM");
    expect(classDateRange({ startsAt: "2099-01-02T15:00:00Z", endsAt: "2099-01-02T16:30:00Z" })).toBe("Fri, Jan 2 · 10 AM to 11:30 AM");
    // Prices follow SITE.pricesPublic: real figures when public, the pending line otherwise.
    expect(classPrice(0)).toBe(PRICES_PUBLIC ? "Free" : PRICE_PENDING);
    expect(classPrice(12500)).toBe(PRICES_PUBLIC ? "$125.00 per person" : PRICE_PENDING);
  });
  it("respects payment, document, closed and sold-out restrictions", () => {
    const s = { ...session(2), priceCents: 0, collectId: false, seatsRemaining: 1 } as PublicClassSession;
    const off = { paymentsEnabled: false, documentsEnabled: false };
    expect(canEnroll(s, off)).toBe(true);
    for (const patch of [{ priceCents: 100 }, { collectId: true }, { status: "closed" }, { seatsRemaining: 0 }]) expect(canEnroll({ ...s, ...patch }, off)).toBe(false);
  });
});