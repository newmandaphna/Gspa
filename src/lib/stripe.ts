import Stripe from "stripe";
import type { Booking, Experience } from "@/lib/db/schema";
import { BOOKING, SITE } from "@/lib/config/site";
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

/**
 * One line item for the booking's computed total (member rate, flat suite
 * price and extra-guest fees are already folded into `booking.amountCents`),
 * so Stripe charges exactly what the summary, confirmation and email show.
 * Never call this for a zero-amount booking: Stripe rejects a $0 Checkout.
 */
export async function createCheckoutSession(booking: Booking, experience: Experience): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const base = SITE.url.replace(/\/$/, "");
  const unitLabel = experience.maxGuestsPerUnit > 1 ? "lane" : "seat";
  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: booking.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: booking.amountCents,
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
    // Stripe validates a 30-minute minimum against its own clock at receipt; the
    // extra minute absorbs latency and skew. The database hold outlives this
    // by BOOKING.holdGraceMin (see sweepExpiredHolds).
    expires_at: Math.floor(Date.now() / 1000) + BOOKING.pendingHoldMin * 60 + 60,
  });
}

/** Log a mismatch between what Stripe collected and what the booking recorded. Never blocks the paid state. */
export function checkAmountCollected(booking: Booking, session: Pick<Stripe.Checkout.Session, "id" | "amount_total">): void {
  if (session.amount_total != null && session.amount_total !== booking.amountCents) {
    console.error(`[stripe] amount mismatch for ${booking.code}: session ${session.id} collected ${session.amount_total}, booking expects ${booking.amountCents}`);
  }
}

export type ExpireResult = { status: "expired" | "skipped" } | { status: "paid"; paymentIntentId: string | null };

/**
 * Close an open Checkout page before its booking is cancelled, so the guest
 * cannot pay for a slot that has been released. If the session already
 * completed, reports "paid" so the caller can keep the reservation instead.
 */
export async function expireCheckoutSession(sessionId: string): Promise<ExpireResult> {
  if (!stripeEnabled()) return { status: "skipped" };
  const stripe = getStripe();
  try {
    await stripe.checkout.sessions.expire(sessionId);
    return { status: "expired" };
  } catch (err) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") return { status: "paid", paymentIntentId: paymentIntentIdOf(session) };
      if (session.status === "expired") return { status: "expired" };
    } catch {
      /* fall through */
    }
    console.error(`[stripe] could not expire session ${sessionId}`, err);
    return { status: "skipped" };
  }
}

export function paymentIntentIdOf(session: Pick<Stripe.Checkout.Session, "payment_intent">): string | null {
  return typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
}

/** Full refund of a payment intent, idempotent per booking code. Throws on failure. */
export async function refundPaymentIntent(paymentIntentId: string, bookingCode: string): Promise<void> {
  const stripe = getStripe();
  try {
    await stripe.refunds.create({ payment_intent: paymentIntentId, reason: "requested_by_customer" }, { idempotencyKey: `refund-${bookingCode}` });
  } catch (err) {
    // Already refunded from the dashboard: treat as done.
    if (err instanceof Stripe.errors.StripeError && err.code === "charge_already_refunded") return;
    throw err;
  }
}
