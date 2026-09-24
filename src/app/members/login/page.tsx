import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/members/AuthForms";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TargetRings } from "@/components/art";
import { getCurrentMember } from "@/lib/members/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Member sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const member = await getCurrentMember();
  if (member) redirect(next && next.startsWith("/") ? next : "/members");

  return (
    <Section theme="light" className="pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
      <Container className="grid items-start gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="t-eyebrow text-accent-deep">Members</p>
          <h1 className="t-hero mt-3">Welcome back.</h1>
          <p className="t-lead mt-4 max-w-[480px] text-ink-muted">Sign in to reserve at member rates, book the bench, and manage your locker and guests.</p>
          <div className="mt-10 max-w-[480px]">
            <SignInForm next={next} />
          </div>
        </div>
        <div className="relative hidden aspect-square overflow-hidden rounded-card bg-night lg:block" data-theme="dark">
          <div className="absolute inset-[10%] opacity-80">
            <TargetRings tone="dark" />
          </div>
          <p className="t-caption absolute bottom-6 left-6 text-mist">Not a member yet? Membership is by application.</p>
        </div>
      </Container>
    </Section>
  );
}
