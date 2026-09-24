import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { Owner } from "@/components/ui/Owner";
import Link from "next/link";
import { Suspense } from "react";
import { ReserveFlow } from "@/components/reserve/ReserveFlow";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { BOOKING, SITE, TIER_WINDOW_DAYS } from "@/lib/config/site";
import { memberCatalog, publicCatalog } from "@/lib/content/catalog";
import { tierByKey } from "@/lib/content/membership";
import { CANCELLATION_POLICY } from "@/lib/content/requirements";
import { getCurrentMember } from "@/lib/members/auth";
import { stripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMeta("/reserve", {
  title: "Reserve",
  description: "Reserve a lane, a private suite, a simulator bay, or a seat with an instructor. Real availability, not a callback.",
});

export default async function ReservePage() {
  const member = await getCurrentMember();
  const experiences = member ? memberCatalog(member.tier) : publicCatalog();
  const memberInfo = member
    ? {
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        memberNumber: member.memberNumber,
        tier: member.tier,
        tierName: tierByKey(member.tier)?.name ?? member.tier,
      }
    : null;

  /** The four policy numbers as one sentence, read from the same BOOKING constants the calendar uses. */
  const policy = `Cancel free up to ${BOOKING.freeCancelHours} hours before, ${BOOKING.suiteFreeCancelHours} for suites and events. The public calendar opens ${BOOKING.maxAdvanceDays} days ahead (members see ${TIER_WINDOW_DAYS.club}, ${TIER_WINDOW_DAYS.signature} or ${TIER_WINDOW_DAYS.founders}), sessions start every ${BOOKING.slotStepMin} minutes, and same-day works with ${BOOKING.leadTimeMin / 60} hours' notice.`;

  return (
    <>
      <Section theme="light" className="pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
        <Container>
          <div className="mb-10 max-w-[720px]">
            <h1 className="t-hero">Pick a lane. Pick a time.</h1>
            <p className="t-lead mt-4 text-ink-muted">Real availability, not a callback. Choose what you want to do, then when. No account required.</p>
          </div>
          <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-paper-2" />}>
            <ReserveFlow experiences={experiences} stripeEnabled={stripeEnabled()} member={memberInfo} />
          </Suspense>
        </Container>
      </Section>

      <Section theme="gray" id="policies">
        <Container>
          <h2 className="t-2">Change of plans.</h2>
          <p className="t-lead mt-2 max-w-[40em] text-ink-muted">{policy}</p>
          <p className="t-caption mt-8 max-w-[640px] text-ink-muted">{CANCELLATION_POLICY}</p>
          <LinkArrow href="/legal#terms" className="mt-3">
            Read full terms
          </LinkArrow>
        </Container>
      </Section>

      <Section theme="black" id="help" className="grain overflow-hidden">
        <Container className="relative">
          <h2 className="t-2">Rather talk to a person.</h2>
          <p className="t-lead mt-2 max-w-[560px] text-mist">Concierge desk, every hour the club is open. Groups over ten and buyouts start with a conversation.</p>
          {/* The phone band is faint in development and hidden in production until the owner replaces 000-0000 in site.ts. */}
          <Owner as="p" value={SITE.phone} className="mt-10 flex items-center gap-4">
            <span className="relative flex h-3 w-3" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
            </span>
            <a href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`} className="t-1 tabular hover:text-accent-2">
              {SITE.phone}
            </a>
          </Owner>
          <p className="t-body mt-4 text-mist">
            <a href={`mailto:${SITE.email}`} className="underline underline-offset-4 hover:text-snow">
              {SITE.email}
            </a>
            {" · "}
            <Link href="/visit#contact" className="underline underline-offset-4 hover:text-snow">
              Contact the desk
            </Link>
          </p>
        </Container>
      </Section>
    </>
  );
}
