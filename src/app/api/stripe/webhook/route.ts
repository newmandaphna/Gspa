import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { cancelBySession, getBookingByCode, getBookingBySession, markPaidBySession, markRefundedBySession } from "@/lib/booking";
import { sendBookingConfirmation } from "@/lib/email";
import { checkAmountCollected, getStripe, paymentIntentIdOf, refundPaymentIntent, stripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Stripe → us. Configure the endpoint in the Stripe dashboard as
 * https://<your-domain>/api/stripe/webhook and set STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  if (!stripeEnabled()) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("[stripe] bad signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        if (session.payment_status === "paid") {
          const pi = paymentIntentIdOf(session);
          const booking = await markPaidBySession(session.id, pi);
          if (booking) {
            checkAmountCollected(booking, session);
            const found = await getBookingByCode(booking.code);
            if (found) void sendBookingConfirmation(found.booking, found.experience);
          } else {
            // Paid after the hold was cancelled (sweep, guest or staff cancel): the slot may be gone,
            // so reverse the charge rather than silently keeping the money. Idempotent on retries.
            const stale = await getBookingBySession(session.id);
            if (stale && stale.status === "cancelled" && stale.paymentStatus === "unpaid" && pi) {
              console.error(`[stripe] payment ${pi} arrived for cancelled booking ${stale.code}; refunding`);
              await refundPaymentIntent(pi, stale.code);
              await markRefundedBySession(session.id, pi);
            } else if (!stale) {
              console.error(`[stripe] paid session ${session.id} matches no booking (code ${session.metadata?.bookingCode ?? "?"})`);
            }
          }
        }
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        await cancelBySession(event.data.object.id);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe] handler failed", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
