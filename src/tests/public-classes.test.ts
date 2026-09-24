import { describe, expect, it } from "vitest";
import { upcomingClasses, classDateRange, classPrice, canEnroll, type PublicClassSession } from "@/lib/public-classes";

describe("public upcoming classes", () => {
  const session = (id: number, status = "open", startsAt = `2099-01-0${id}T12:00:00Z`) => ({ id, status, startsAt });
  it("filters past, started, draft and cancelled sessions, sorts chronologically and limits to three", () => {
    const now = Date.parse("2099-01-01T12:00:00Z");
    expect(upcomingClasses([session(5), session(1), session(3, "closed"), session(4), session(2), session(6, "draft"), session(7, "cancelled"), session(8, "open", "2020-01-01")], now, 3).map(s => s.id)).toEqual([2, 3, 4]);
  });
  it("shows New York start and end dates across midnight and free pricing", () => {
    const range = classDateRange({ startsAt: "2099-01-02T04:00:00Z", endsAt: "2099-01-02T07:00:00Z" });
    expect(range).toContain("Jan 1, 2099");
    expect(range).toContain("Jan 2, 2099");
    expect(range).toContain("America/New_York");
    expect(classPrice(0)).toBe("Free");
    expect(classPrice(12500)).toBe("$125.00 per person");
  });
  it("respects payment, document, closed and sold-out restrictions", () => {
    const s = { ...session(2), priceCents: 0, collectId: false, seatsRemaining: 1 } as PublicClassSession;
    const off = { paymentsEnabled: false, documentsEnabled: false };
    expect(canEnroll(s, off)).toBe(true);
    for (const patch of [{ priceCents: 100 }, { collectId: true }, { status: "closed" }, { seatsRemaining: 0 }]) expect(canEnroll({ ...s, ...patch }, off)).toBe(false);
  });
});