import { NextResponse } from "next/server";
import { attachStripeSession, createBooking } from "@/lib/booking";
import { sendBookingConfirmation } from "@/lib/email";
import { expectedJson, isJsonRequest } from "@/lib/http";
import { getCurrentMember } from "@/lib/members/auth";
import { toContext } from "@/lib/members/service";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { createCheckoutSession, stripeEnabled } from "@/lib/stripe";
import { bookingInputSchema, firstIssue } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(`book:${clientKey(req)}`, { limit: 10, windowMs: 10 * 60_000 })) {
    return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
  }
  if (!isJsonRequest(req)) return expectedJson();
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bookingInputSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  const paymentMode = stripeEnabled() ? "stripe" : "on_arrival";
  let result;
  try {
    const current = await getCurrentMember();
    result = await createBooking({
      ...parsed.data,
      memberNumber: parsed.data.memberNumber || null,
      member: current ? toContext(current) : null,
      notes: parsed.data.notes || null,
      paymentMode,
    });
  } catch (err) {
    console.error("[bookings] create failed", err);
    return NextResponse.json({ error: "We couldn't complete your reservation. Please try again." }, { status: 500 });
  }
  if (!result.ok) {
    const status = result.code === "NOT_FOUND" ? 404 : result.code === "UNAVAILABLE" ? 409 : result.code === "MEMBERS_ONLY" ? 403 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  const { booking, experience } = result;
  // Branch on what was persisted: a $0 (member-included) booking confirms without Checkout even when Stripe is on.
  if (booking.paymentStatus === "unpaid") {
    try {
      const session = await createCheckoutSession(booking, experience);
      await attachStripeSession(booking.id, session.id);
      return NextResponse.json({ code: booking.code, redirectUrl: session.url, payment: "stripe" });
    } catch (err) {
      console.error("[bookings] stripe session failed", err);
      return NextResponse.json({ error: "Payment could not be started. Please try again." }, { status: 502 });
    }
  }
  void sendBookingConfirmation(booking, experience);
  return NextResponse.json({ code: booking.code, redirectUrl: `/reserve/confirmation/${booking.code}`, payment: "on_arrival" });
}
