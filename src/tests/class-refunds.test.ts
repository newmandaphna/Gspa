import { describe, expect, it, vi } from "vitest";
process.env.PGLITE_DATA_DIR = "memory://";
delete process.env.DATABASE_URL;
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { createClassBooking, saveClassSession } from "@/lib/classes";
import { attachStripeSession, cancelBooking, getBookingByCode, markPaidBySession } from "@/lib/booking";

let sequence = 0;
async function paidBooking() {
  const session = await saveClassSession({
    experienceSlug: "nys-ccw-course", title: "Refund regression", date: "2035-10-06", startTime: "09:00",
    endDate: "2035-10-07", endTime: "17:00", priceCents: 10000, capacity: 2, maxPerBooking: 2, status: "open",
  });
  if (!session.ok) throw new Error(session.error);
  const result = await createClassBooking({
    sessionId: session.session.id, firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", phone: "7185550100",
    mailingAddress: { line1: "123 Main St", city: "Queens", state: "NY", postalCode: "11432", country: "US" },
    attendees: [{ firstName: "Ada", lastName: "Lovelace" }], ackRequirements: true, paymentMode: "stripe",
  });
  if (!result.ok) throw new Error(result.error);
  const checkout = `cs_refund_${++sequence}`;
  await attachStripeSession(result.booking.id, checkout);
  await markPaidBySession(checkout, `pi_refund_${sequence}`);
  return result.booking;
}

describe("class cancellation refund consistency", () => {
  it.each([false, true])("atomically records cancellation and refund for admin=%s", async byAdmin => {
    const booking = await paidBooking();
    const refund = vi.fn(async () => {
      const before = (await getBookingByCode(booking.code))!.booking;
      expect(before.status).toBe("confirmed");
      expect(before.paymentStatus).toBe("paid");
    });
    const result = await cancelBooking(booking.code, { byAdmin, email: booking.email, refund });
    expect(result.ok).toBe(true);
    expect(refund).toHaveBeenCalledOnce();
    const current = (await getBookingByCode(booking.code))!.booking;
    expect(current.status).toBe("cancelled");
    expect(current.paymentStatus).toBe("refunded");
  });
  it("leaves paid enrollment active when refund fails", async () => {
    const booking = await paidBooking();
    const result = await cancelBooking(booking.code, { byAdmin: true, refund: async () => { throw new Error("provider unavailable"); } });
    expect(result.ok).toBe(false);
    expect((await getBookingByCode(booking.code))!.booking).toMatchObject({ status: "confirmed", paymentStatus: "paid" });
  });
  it("reconciles a legacy cancelled-paid row on retry without reviving capacity", async () => {
    const booking = await paidBooking();
    await (await getDb()).update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, booking.id));
    const refund = vi.fn(async () => {});
    expect((await cancelBooking(booking.code, { byAdmin: true, refund })).ok).toBe(true);
    expect((await getBookingByCode(booking.code))!.booking).toMatchObject({ status: "cancelled", paymentStatus: "refunded" });
    expect((await cancelBooking(booking.code, { byAdmin: true, refund })).ok).toBe(true);
    expect(refund).toHaveBeenCalledOnce();
  });
  it("concurrent guest and admin cancellation converge on cancelled/refunded", async () => {
    const booking = await paidBooking();
    let entered = 0;
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const refund = vi.fn(async () => { if (++entered === 2) release(); await gate; });
    const results = await Promise.all([
      cancelBooking(booking.code, { byAdmin: true, refund }),
      cancelBooking(booking.code, { email: booking.email, refund }),
    ]);
    expect(results.every(r => r.ok)).toBe(true);
    expect((await getBookingByCode(booking.code))!.booking).toMatchObject({ status: "cancelled", paymentStatus: "refunded" });
  });
  it.each(["paymentStatus", "stripePaymentIntentId"] as const)("does not overwrite a concurrent %s change during refund", async field => {
    const booking = await paidBooking();
    const refund = async () => {
      await (await getDb()).update(bookings).set(field === "paymentStatus" ? { paymentStatus: "refunded" } : { stripePaymentIntentId: "pi_changed" })
        .where(eq(bookings.id, booking.id));
    };
    const result = await cancelBooking(booking.code, { email: booking.email, refund });
    expect(result.ok).toBe(false);
    expect((await getBookingByCode(booking.code))!.booking.status).toBe("confirmed");
    // A retry reads the new payment state rather than reviving or overwriting it.
    expect((await cancelBooking(booking.code, { email: booking.email, refund: async () => {} })).ok).toBe(true);
    expect((await getBookingByCode(booking.code))!.booking).toMatchObject({ status: "cancelled", paymentStatus: "refunded" });
  });
});