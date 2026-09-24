import { and, eq, isNull, ne } from "drizzle-orm";
import { listClassRoster } from "@/lib/classes";
import { cancelBooking, confirmPaidSession } from "@/lib/booking";
import { confirmationText, sendEmail, sendBookingCancellation, sendBookingConfirmation } from "@/lib/email";
import { expireCheckoutSession } from "@/lib/stripe";
import { purgeExpiredClassDocuments } from "@/lib/class-documents";
import { getDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { errorResponse, guard, json, positiveId, readJson, RequestError } from "../../../../../classes/_shared";

export async function POST(req: Request, ctx: { params: Promise<{ id: string; bookingId: string }> }) {
  try {
    await guard(req, true);
    const params = await ctx.params;
    const id = positiveId(params.id), bookingId = positiveId(params.bookingId);
    const { action } = await readJson(req);
    const row = (await listClassRoster(id)).find(r => r.booking.id === bookingId);
    if (!row) throw new RequestError("Enrollment not found.", 404);
    const { booking, experience } = row;
    if (booking.status === "cancelled" && action !== "cancel") throw new RequestError("Enrollment is cancelled.", 409);
    const db = await getDb();
    if (action === "mark_paid") {
      if (booking.stripeSessionId) throw new RequestError("This enrollment has Stripe Checkout. Reconcile its payment in Stripe instead.", 409);
      const [updated] = await db.update(bookings).set({ status: "confirmed", paymentStatus: "paid", updatedAt: new Date() })
        .where(and(eq(bookings.id, bookingId), ne(bookings.status, "cancelled"), isNull(bookings.stripeSessionId))).returning();
      if (!updated) throw new RequestError("Enrollment changed. Reload and try again.", 409);
      await sendBookingConfirmation(updated, experience);
      return json({ ok: true });
    }
    if (action === "resend_confirmation") {
      if (booking.status !== "confirmed") throw new RequestError("Only confirmed enrollments can receive confirmation.", 409);
      // A staff-requested resend is a new delivery, not the outbox's
      // deduplicated original confirmation event.
      const email = await sendEmail("confirmation", booking.email, confirmationText(booking, experience));
      if (email !== "sent") throw new RequestError(email === "skipped" ? "Email is not configured." : "The email provider refused delivery. Please retry.", 503);
      return json({ ok: true, email });
    }
    if (action !== "cancel") throw new RequestError("Unknown action.");
    // Close Checkout before deciding whether a refund is due; payment may
    // have completed after the roster was loaded.
    if (booking.status === "pending" && booking.stripeSessionId) {
      const expired = await expireCheckoutSession(booking.stripeSessionId);
      if (expired.status === "skipped") throw new RequestError("Checkout could not be safely closed. Retry after reconciling Stripe.", 409);
      if (expired.status === "paid") await confirmPaidSession(booking.stripeSessionId, expired.paymentIntentId);
    }
    const result = await cancelBooking(booking.code, { byAdmin: true, refundPaid: true });
    if (!result.ok) throw new RequestError(result.error, 409);
    await purgeExpiredClassDocuments();
    await sendBookingCancellation(result.booking, result.experience, "guest");
    return json({ ok: true });
  } catch (error) { return errorResponse(error); }
}