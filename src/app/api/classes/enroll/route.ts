import { createClassBooking, getClassSession } from "@/lib/classes";
import { classEnrollmentSchema } from "@/lib/classes-validation";
import { attachStripeSession, cancelBooking } from "@/lib/booking";
import { sendBookingConfirmation } from "@/lib/email";
import { createCheckoutSession, expireCheckoutSession, stripeEnabled } from "@/lib/stripe";
import { DOCUMENT_TOTAL_BYTES, documentUploadsEnabled, normalizeClassDocument, purgeExpiredClassDocuments, storeClassDocuments } from "@/lib/class-documents";
import { boundedBody, errorResponse, guard, json, RequestError } from "../_shared";

export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    await guard(req);
    const type = req.headers.get("content-type") ?? "";
    if (!/^multipart\/form-data\b/i.test(type)) throw new RequestError("Send multipart/form-data.", 415);
    const bytes = await boundedBody(req, DOCUMENT_TOTAL_BYTES + 128 * 1024);
    let form: FormData;
    try { form = await new Response(new Uint8Array(bytes), { headers: { "content-type": type } }).formData(); }
    catch { throw new RequestError("Invalid multipart form."); }
    let payload;
    try { payload = JSON.parse(String(form.get("payload"))); } catch { throw new RequestError("Invalid enrollment payload."); }
    const parsed = classEnrollmentSchema.safeParse(payload);
    if (!parsed.success) throw new RequestError(parsed.error.issues[0].message);
    const session = await getClassSession(parsed.data.sessionId);
    if (!session || !["open", "closed"].includes(session.status)) throw new RequestError("Class not found.", 404);
    if (session.priceCents > 0 && !stripeEnabled()) throw new RequestError("Online payments are unavailable. Please contact the front desk.", 503);
    const images: Buffer[] = [];
    let total = 0;
    if (session.collectId) {
      if (!documentUploadsEnabled()) throw new RequestError("Secure document collection is unavailable. Contact the front desk.", 503);
      if (payload.documentConsent !== true) throw new RequestError("Consent to identity document collection is required.");
      for (let i = 0; i < parsed.data.attendees.length; i++) {
        const file = form.get(`document_${i}`);
        if (!file || typeof file === "string") throw new RequestError("Upload an ID image for every attendee.");
        total += file.size;
        if (total > DOCUMENT_TOTAL_BYTES) throw new RequestError("Combined ID images must be at most 8 MiB.", 413);
        try { images.push(await normalizeClassDocument(Buffer.from(await file.arrayBuffer()))); }
        catch (error) { throw new RequestError((error as Error).message); }
      }
    }
    await purgeExpiredClassDocuments();
    const result = await createClassBooking({ ...parsed.data, paymentMode: "stripe" });
    if (!result.ok) return json({ error: result.error, code: result.code }, result.code === "NOT_FOUND" ? 404 : 409);
    const { booking, experience } = result;
    let checkoutId: string | undefined;
    try {
      // The persisted snapshot is authoritative if staff changed collection requirements mid-request.
      if (booking.classDetails?.collectId && images.length !== booking.guests) throw new Error("Document requirements changed. Please retry.");
      await storeClassDocuments(booking.id, booking.endsAt, images);
      if (booking.paymentStatus === "unpaid") {
        if (!stripeEnabled()) throw new Error("Payments unavailable.");
        const checkout = await createCheckoutSession(booking, experience);
        checkoutId = checkout.id;
        if (!checkout.url) throw new Error("Checkout URL unavailable.");
        await attachStripeSession(booking.id, checkout.id);
        return json({ code: booking.code, redirectUrl: checkout.url, payment: "stripe" });
      }
    } catch {
      if (checkoutId) await expireCheckoutSession(checkoutId);
      await cancelBooking(booking.code, { byAdmin: true });
      await purgeExpiredClassDocuments();
      throw new RequestError("Enrollment could not be completed. Your seats have been released; please try again.", 502);
    }
    await sendBookingConfirmation(booking, experience);
    return json({ code: booking.code, redirectUrl: `/reserve/confirmation/${booking.code}`, payment: "on_arrival" });
  } catch (error) { return errorResponse(error); }
}