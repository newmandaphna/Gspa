import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { cancelBySession, getBookingByCode, markPaidBySession } from "@/lib/booking";
import { sendBookingConfirmation } from "@/lib/email";
import { getStripe, stripeEnabled } from "@/lib/stripe";

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
          const pi = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
          const booking = await markPaidBySession(session.id, pi);
          if (booking) {
            const found = await getBookingByCode(booking.code);
            if (found) void sendBookingConfirmation(found.booking, found.experience);
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
