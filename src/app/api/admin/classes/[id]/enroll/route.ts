import { and, eq, ne } from "drizzle-orm";
import { createClassBooking, getClassSession } from "@/lib/classes";
import { classEnrollmentSchema } from "@/lib/classes-validation";
import { cancelBooking } from "@/lib/booking";
import { sendBookingConfirmation } from "@/lib/email";
import { getDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { errorResponse, guard, json, positiveId, readJson, RequestError } from "../../../../classes/_shared";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await guard(req, true);
    const id = positiveId((await ctx.params).id);
    const body = await readJson(req);
    const parsed = classEnrollmentSchema.safeParse({ ...body, sessionId: id });
    if (!parsed.success) throw new RequestError(parsed.error.issues[0].message);
    if (!["paid", "pay_on_arrival"].includes(body.recordPayment)) throw new RequestError("Choose paid or pay on arrival.");
    const session = await getClassSession(id);
    if (!session) throw new RequestError("Class not found.", 404);
    if (session.collectId && body.idVerifiedInPerson !== true) throw new RequestError("Verify all attendee IDs in person first.");
    const result = await createClassBooking({ ...parsed.data, paymentMode: "on_arrival", byAdmin: true });
    if (!result.ok) return json({ error: result.error }, 409);
    if (result.booking.classDetails?.collectId && body.idVerifiedInPerson !== true) {
      await cancelBooking(result.booking.code, { byAdmin: true });
      throw new RequestError("ID requirements changed. Verify attendee IDs and retry.", 409);
    }
    if (body.recordPayment === "paid") {
      const db = await getDb();
      const [updated] = await db.update(bookings).set({ paymentStatus: "paid", updatedAt: new Date() })
        .where(and(eq(bookings.id, result.booking.id), ne(bookings.status, "cancelled"))).returning();
      if (!updated) throw new RequestError("Booking was cancelled.", 409);
      result.booking = updated;
    }
    await sendBookingConfirmation(result.booking, result.experience);
    return json({ code: result.booking.code, booking: result.booking, payment: body.recordPayment });
  } catch (error) { return errorResponse(error); }
}