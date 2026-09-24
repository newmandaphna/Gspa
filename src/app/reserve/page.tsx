import type { Metadata } from "next";
import { Suspense } from "react";
import { ReserveFlow } from "@/components/reserve/ReserveFlow";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { memberCatalog, publicCatalog } from "@/lib/content/catalog";
import { tierByKey } from "@/lib/content/membership";
import { getCurrentMember } from "@/lib/members/auth";
import { stripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Reserve",
  description: "Reserve a lane, a private suite, a simulator bay, or a seat in a class. Real-time availability.",
};

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

  return (
    <Section theme="light" className="pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
      <Container>
        <div className="mb-10 max-w-[720px]">
          <h1 className="t-hero">Reserve.</h1>
          <p className="t-lead mt-4 text-ink-muted">Pick an experience, choose a time, and you&apos;re done. No account required.</p>
        </div>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-paper-2" />}>
          <ReserveFlow experiences={experiences} stripeEnabled={stripeEnabled()} member={memberInfo} />
        </Suspense>
      </Container>
    </Section>
  );
}
