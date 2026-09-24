import Stripe from "stripe";
import type { Booking, Experience } from "@/lib/db/schema";
import { SITE } from "@/lib/config/site";
import { formatInstant } from "@/lib/time";

/**
 * Stripe is entirely optional. With STRIPE_SECRET_KEY unset, reservations are
 * confirmed immediately as "pay on arrival". Set the key (and
 * STRIPE_WEBHOOK_SECRET for /api/stripe/webhook) to collect payment up front.
 */
export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | null = null;
export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key, { appInfo: { name: "The Gun Spa Reservations", url: SITE.url } });
  }
  return client;
}

export async function createCheckoutSession(booking: Booking, experience: Experience): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const base = SITE.url.replace(/\/$/, "");
  const unitLabel = experience.maxGuestsPerUnit > 1 ? "lane" : "seat";
  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: booking.email,
    line_items: [
      {
        quantity: booking.units,
        price_data: {
          currency: "usd",
          unit_amount: experience.priceCents,
          product_data: {
            name: experience.name,
            description: `${formatInstant(booking.startsAt)} · ${booking.guests} guest${booking.guests === 1 ? "" : "s"} · ${booking.units} ${unitLabel}${booking.units === 1 ? "" : "s"}`,
          },
        },
      },
    ],
    metadata: { bookingCode: booking.code, bookingId: String(booking.id) },
    payment_intent_data: { metadata: { bookingCode: booking.code } },
    success_url: `${base}/reserve/confirmation/${booking.code}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/reserve?cancelled=${booking.code}`,
    // Stripe's minimum is 30 minutes; matches BOOKING.pendingHoldMin.
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });
}
