import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActivateForm } from "@/components/members/AuthForms";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getCurrentMember } from "@/lib/members/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Activate your membership", robots: { index: false } };

export default async function ActivatePage() {
  if (await getCurrentMember()) redirect("/members");
  return (
    <Section theme="light" className="pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
      <Container size="sm">
        <p className="t-eyebrow text-accent-deep">Members</p>
        <h1 className="t-hero mt-3">Activate your account.</h1>
        <p className="t-lead mt-4 text-ink-muted">Your welcome packet includes a one-time activation code. Enter it once, choose a password, and you&apos;re in.</p>
        <div className="mt-10">
          <ActivateForm />
        </div>
      </Container>
    </Section>
  );
}
