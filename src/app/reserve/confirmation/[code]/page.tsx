import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelForm } from "@/components/reserve/CancelForm";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getBookingByCode, markPaidBySession } from "@/lib/booking";
import { BOOKING, SITE } from "@/lib/config/site";
import { requirementsFor } from "@/lib/content/requirements";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { formatInstant, formatMoney } from "@/lib/time";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your reservation", robots: { index: false, follow: false } };

function unitNoun(category: string, n: number): string {
  const base = category === "training" ? "seat" : category === "suite" ? "suite" : category === "experience" ? "bay" : category === "service" ? "appointment" : "lane";
  return `${n} ${base}${n === 1 ? "" : "s"}`;
}

function cancellableNow(startsAt: Date): boolean {
  return startsAt.getTime() - Date.now() > BOOKING.freeCancelHours * 3_600_000;
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 1)}${"•".repeat(Math.max(2, Math.min(6, user.length - 1)))}@${domain}`;
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { code } = await params;
  const { session_id } = await searchParams;
  let found = await getBookingByCode(code);
  if (!found) notFound();

  // Reconcile a Stripe return even if the webhook hasn't fired yet.
  if (found.booking.status === "pending" && session_id && stripeEnabled() && found.booking.stripeSessionId === session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid") {
        const pi = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
        await markPaidBySession(session_id, pi);
        found = (await getBookingByCode(code)) ?? found;
      }
    } catch (err) {
      console.error("[confirmation] stripe reconcile failed", err);
    }
  }

  const { booking, experience } = found;
  const status =
    booking.status === "cancelled"
      ? { label: "Cancelled", tone: "bg-ink/10 text-ink" }
      : booking.status === "pending"
        ? { label: "Awaiting payment", tone: "bg-accent/25 text-accent-deep" }
        : { label: "Confirmed", tone: "bg-success/15 text-[#1f7a3a]" };
  const canCancel = booking.status !== "cancelled" && cancellableNow(booking.startsAt);
  const headline = booking.status === "cancelled" ? "Reservation cancelled." : booking.status === "pending" ? "Almost there." : `See you soon, ${booking.firstName}.`;

  return (
    <Section theme="light" className="pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
      <Container size="md">
        <span className={cn("t-caption inline-flex rounded-pill px-3 py-1 font-semibold", status.tone)}>{status.label}</span>
        <h1 className="t-hero mt-4">{headline}</h1>
        {booking.status === "pending" && (
          <p className="t-lead mt-4 text-ink-muted">Your slot is held for {BOOKING.pendingHoldMin} minutes while payment completes. If you closed the payment page, start a new reservation.</p>
        )}
        {booking.status === "confirmed" && (
          <p className="t-lead mt-4 text-ink-muted">A confirmation is on its way to {maskEmail(booking.email)}. Arrive 15 minutes early for check-in and the safety briefing.</p>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="rounded-card bg-white p-6 ring-1 ring-ink/8 shadow-[var(--shadow-card)] sm:p-8">
            <p className="t-eyebrow text-ink-faint">Confirmation code</p>
            <p className="mt-2 font-mono text-[1.75rem] font-semibold tracking-wide">{booking.code}</p>
            <dl className="mt-6 grid gap-3 t-body sm:grid-cols-2">
              <Item label="Experience" value={experience.name} />
              <Item label="When" value={formatInstant(booking.startsAt)} />
              <Item label="Duration" value={`${experience.durationMin} minutes`} />
              <Item label="Guests" value={`${booking.guests} · ${unitNoun(experience.category, booking.units)}`} />
              <Item label="Name" value={`${booking.firstName} ${booking.lastName}`} />
              <Item
                label="Total"
                value={
                  booking.amountCents === 0
                    ? "Included with membership"
                    : `${formatMoney(booking.amountCents)} · ${booking.paymentStatus === "paid" ? "paid" : booking.paymentStatus === "pay_on_arrival" ? "due on arrival" : booking.paymentStatus}`
                }
              />
              {booking.memberNumber && <Item label="Member" value={booking.memberNumber} />}
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/visit" variant="secondary" size="sm">
                Directions & parking
              </Button>
              <Button href="/reserve" variant="secondary" size="sm">
                Make another reservation
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-card bg-paper-2 p-6">
              <p className="t-4">Bring</p>
              <ul className="mt-3 space-y-2">
                {requirementsFor(experience.eligibility as "handgun" | "longgun" | "simulator" | "anyone", Boolean(booking.memberId))
                  .slice(0, 3)
                  .map((r) => (
                    <li key={r.text} className="t-caption flex gap-2 text-ink-muted">
                      <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent-deep" />
                      {r.text}
                    </li>
                  ))}
              </ul>
              <Link href="/visit#requirements" className="link-arrow mt-3 text-[0.9375rem]">
                All requirements
              </Link>
            </div>
            <div className="rounded-card bg-paper-2 p-6">
              <p className="t-4">Need to change plans?</p>
              <p className="t-caption mt-2 text-ink-muted">
                Free cancellation up to {BOOKING.freeCancelHours} hours before your session. After that, call {SITE.phone}.
              </p>
              {canCancel ? <CancelForm code={booking.code} /> : booking.status !== "cancelled" ? <p className="t-caption mt-3 font-semibold">Online cancellation has closed for this reservation.</p> : null}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="t-caption text-ink-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
