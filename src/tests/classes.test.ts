import { describe, expect, it } from "vitest";
process.env.PGLITE_DATA_DIR = "memory://";
delete process.env.DATABASE_URL;

import { createClassBooking, getClassSession, listClassRoster, listClassSessions, saveClassSession } from "@/lib/classes";
import { classEnrollmentSchema, classSessionInputSchema } from "@/lib/classes-validation";
import { adminSetStatus, attachStripeSession, cancelBooking, cancelBySession, confirmPaidSession, createBooking, getBookingByCode, markPaidBySession, sweepExpiredHolds } from "@/lib/booking";
import { classMailOutbox } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { zonedToUtc } from "@/lib/time";

const sessionInput = {
  experienceSlug: "nys-ccw-course", title: "Scheduled CCW",
  date: "2035-10-06", startTime: "09:00", endDate: "2035-10-07", endTime: "17:00",
  priceCents: 50000, capacity: 2, maxPerBooking: 2,
  status: "open" as const, instructor: "Instructor", requirements: "Bring required paperwork.", collectId: true,
};
const enrollment = {
  firstName: "Ada", lastName: "Lovelace", email: "ADA@example.com", phone: "7185550100",
  mailingAddress: { line1: "123 Main St", city: "Queens", state: "NY", postalCode: "11432", country: "US" },
  attendees: [{ firstName: "Ada", lastName: "Lovelace" }], ackRequirements: true as const,
  paymentMode: "stripe" as const,
};
async function make(patch: Partial<typeof sessionInput> = {}) {
  const result = await saveClassSession({ ...sessionInput, ...patch });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error);
  return result.session;
}

describe("scheduled classes (PGlite)", () => {
  it("rejects legacy desk status changes for class enrollments", async () => {
    const session = await make();
    const result = await createClassBooking({ ...enrollment, sessionId: session.id });
    if (!result.ok) throw new Error(result.error);
    await expect(adminSetStatus(result.booking.id, { status: "cancelled", paymentStatus: "refunded" })).rejects.toThrow("class roster");
    const current = await getBookingByCode(result.booking.code);
    expect(current?.booking.status).toBe("pending");
    expect(current?.booking.paymentStatus).toBe("unpaid");
  });
  it("initializes the outbox locally and persists confirmation before payment reconciliation returns", async () => {
    const session = await make();
    const result = await createClassBooking({ ...enrollment, sessionId: session.id });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    const stripeSession = `cs_class_confirmation_${result.booking.id}`;
    await attachStripeSession(result.booking.id, stripeSession);
    expect(await confirmPaidSession(stripeSession, "pi_class_confirmation")).not.toBeNull();
    const db = await getDb();
    const messages = await db.select().from(classMailOutbox).where(eq(classMailOutbox.bookingId, result.booking.id));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ kind: "confirmation", status: "pending" });
    expect(await confirmPaidSession(stripeSession, "pi_class_confirmation")).toBeNull();
    expect(await db.select().from(classMailOutbox).where(eq(classMailOutbox.bookingId, result.booking.id))).toHaveLength(1);
  });
  it("validates dates, attendees, limits and training catalog without creating products", async () => {
    expect(classSessionInputSchema.safeParse({ ...sessionInput, date: "2035-02-30" }).success).toBe(false);
    expect(classSessionInputSchema.safeParse({ ...sessionInput, endDate: "2030-01-01" }).success).toBe(false);
    expect(classSessionInputSchema.safeParse({ ...sessionInput, capacity: 201 }).success).toBe(false);
    expect(classSessionInputSchema.safeParse({ ...sessionInput, priceCents: -1 }).success).toBe(false);
    expect(classEnrollmentSchema.safeParse({ ...enrollment, sessionId: 1, attendees: [] }).success).toBe(false);
    expect(classEnrollmentSchema.safeParse({ ...enrollment, sessionId: 1, attendees: Array(21).fill(enrollment.attendees[0]) }).success).toBe(false);
    expect((await saveClassSession({ ...sessionInput, experienceSlug: "lane-session" })).ok).toBe(false);
    expect((await saveClassSession({ ...sessionInput, experienceSlug: "invented-course" })).ok).toBe(false);
    expect(classSessionInputSchema.safeParse({ ...sessionInput, date: "2035-03-11", startTime: "02:30" }).success).toBe(false);
  });

  it("uses regular bookings with immutable class snapshots and timezone timestamps", async () => {
    const s = await make();
    const r = await createClassBooking({ ...enrollment, sessionId: s.id });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.booking.classSessionId).toBe(s.id);
    expect(r.booking.resource).toBe(`class:${s.id}`);
    expect(r.booking.startsAt).toEqual(zonedToUtc(sessionInput.date, sessionInput.startTime));
    expect(r.booking.endsAt).toEqual(zonedToUtc(sessionInput.endDate, sessionInput.endTime));
    expect(r.booking.email).toBe("ada@example.com");
    expect(r.booking.classDetails?.collectId).toBe(true);
    expect(r.booking.mailingAddress).toEqual(enrollment.mailingAddress);
    expect((await getBookingByCode(r.booking.code))?.experience.name).toBe(sessionInput.title);
    expect((await listClassRoster(s.id))[0].booking.id).toBe(r.booking.id);
    expect((await saveClassSession({ ...sessionInput, title: "Changed" }, s.id)).ok).toBe(false);
    expect((await saveClassSession({ ...sessionInput, status: "cancelled" }, s.id)).ok).toBe(false);
    expect((await saveClassSession({ ...sessionInput, priceCents: 60000 }, s.id)).ok).toBe(true);
    expect((await getBookingByCode(r.booking.code))?.booking.amountCents).toBe(50000);
    await attachStripeSession(r.booking.id, `cs_classes_${s.id}`);
    await markPaidBySession(`cs_classes_${s.id}`, "pi_class");
    expect((await getClassSession(s.id))?.paidSeats).toBe(1);
    expect((await getClassSession(s.id))?.heldSeats).toBe(0);
  });

  it("serializes concurrent enrollments, rejects capacity reductions and isolates sessions", async () => {
    const s = await make({ capacity: 1, maxPerBooking: 1 });
    const results = await Promise.all([
      createClassBooking({ ...enrollment, sessionId: s.id }),
      createClassBooking({ ...enrollment, sessionId: s.id, byAdmin: true, paymentMode: "on_arrival" }),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect((await getClassSession(s.id))?.seatsRemaining).toBe(0);
    const other = await make();
    expect((await createClassBooking({ ...enrollment, sessionId: other.id, attendees: [...enrollment.attendees, { firstName: "Grace", lastName: "Hopper" }] })).ok).toBe(true);
    expect((await saveClassSession({ ...sessionInput, capacity: 1, maxPerBooking: 1 }, other.id)).ok).toBe(false);
    expect((await getClassSession(other.id))?.seatsTaken).toBe(2);
  });

  it("allows staff closed enrollments, rejects public arrival payment and confirms free classes", async () => {
    const s = await make();
    await saveClassSession({ ...sessionInput, status: "closed" }, s.id);
    expect((await createClassBooking({ ...enrollment, sessionId: s.id })).ok).toBe(false);
    const staff = await createClassBooking({ ...enrollment, sessionId: s.id, byAdmin: true, paymentMode: "on_arrival" });
    expect(staff.ok && staff.booking.paymentStatus).toBe("pay_on_arrival");
    const open = await make();
    expect((await createClassBooking({ ...enrollment, sessionId: open.id, paymentMode: "on_arrival" })).ok).toBe(false);
    const free = await make({ priceCents: 0 });
    const r = await createClassBooking({ ...enrollment, sessionId: free.id });
    expect(r.ok && r.booking.status).toBe("confirmed");
    const draft = await saveClassSession({ ...sessionInput, status: "draft" });
    if (draft.ok) expect((await createClassBooking({ ...enrollment, sessionId: draft.session.id, byAdmin: true })).ok).toBe(false);
    expect((await listClassSessions()).some((x) => draft.ok && x.id === draft.session.id)).toBe(false);
  });

  it("serializes capacity edits against enrollment and rejects past staff enrollment", async () => {
    const s = await make();
    await Promise.all([
      saveClassSession({ ...sessionInput, capacity: 1, maxPerBooking: 1 }, s.id),
      createClassBooking({ ...enrollment, sessionId: s.id, attendees: [enrollment.attendees[0], { firstName: "Grace", lastName: "Hopper" }] }),
    ]);
    const current = await getClassSession(s.id);
    expect(current!.seatsTaken).toBeLessThanOrEqual(current!.capacity);
    const past = await saveClassSession({ ...sessionInput, date: "2020-10-01", endDate: "2020-10-02" });
    if (!past.ok) throw new Error(past.error);
    expect((await createClassBooking({ ...enrollment, sessionId: past.session.id, byAdmin: true })).ok).toBe(false);
  });

  it("releases cancelled and expired seats through the existing lifecycle", async () => {
    const s = await make({ capacity: 1, maxPerBooking: 1 });
    const r = await createClassBooking({ ...enrollment, sessionId: s.id });
    if (!r.ok) throw new Error(r.error);
    await attachStripeSession(r.booking.id, `cs_expired_class_${s.id}`);
    await cancelBySession(`cs_expired_class_${s.id}`);
    expect((await getClassSession(s.id))?.seatsRemaining).toBe(1);
    const stale = await createClassBooking({ ...enrollment, sessionId: s.id, now: new Date(Date.now() - 3600000) });
    expect(stale.ok).toBe(true);
    await sweepExpiredHolds(await getDb(), new Date());
    expect((await getClassSession(s.id))?.seatsRemaining).toBe(1);
    const staff = await createClassBooking({ ...enrollment, sessionId: s.id, byAdmin: true, paymentMode: "on_arrival" });
    if (!staff.ok) throw new Error(staff.error);
    expect((await cancelBooking(staff.booking.code, { byAdmin: true })).ok).toBe(true);
    expect((await saveClassSession({ ...sessionInput, capacity: 1, maxPerBooking: 1, status: "cancelled" }, s.id)).ok).toBe(true);
  });

  it("preserves ordinary lane bookings without class fields", async () => {
    const r = await createBooking({
      ...enrollment, experienceSlug: "lane-session", date: "2026-10-08", time: "12:00",
      guests: 1, paymentMode: "on_arrival", now: new Date("2026-10-05T14:00:00Z"),
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.booking.classSessionId).toBeNull();
      expect(r.booking.resource).toBe("lane");
    }
  });
});