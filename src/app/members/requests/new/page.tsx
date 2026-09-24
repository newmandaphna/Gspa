import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RequestForm } from "@/components/members/AuthForms";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getCurrentMember } from "@/lib/members/auth";
import { REQUEST_KINDS } from "@/lib/members/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New request", robots: { index: false } };

const PLACEHOLDERS: Record<string, string> = {
  locker: "Preferred size and location, and anything you'll keep in it.",
  guest_pass: "How many passes, for when, and who you're bringing.",
  storage: "What you'd like stored and for how long.",
  ammo: "Caliber, quantity, and when you'd like it ready.",
  gunsmith: "The firearm, the issue, and how soon you need it back.",
  general: "Anything at all. The team reads every one.",
};

export default async function NewRequestPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const member = await getCurrentMember();
  if (!member) redirect("/members/login?next=/members/requests/new");
  const { kind: raw } = await searchParams;
  const kind = raw && raw in REQUEST_KINDS ? raw : "general";
  return (
    <Section theme="light" className="pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
      <Container size="sm">
        <p className="t-eyebrow text-accent-deep">Members</p>
        <h1 className="t-hero mt-3">Ask the team.</h1>
        <p className="t-lead mt-4 text-ink-muted">Lockers, guest passes, storage, ammunition, gunsmith work. Tell us what you need and we&apos;ll confirm by email.</p>
        <div className="mt-10">
          <RequestForm kind={kind} kinds={REQUEST_KINDS} placeholder={PLACEHOLDERS[kind] ?? PLACEHOLDERS.general} />
        </div>
      </Container>
    </Section>
  );
}
