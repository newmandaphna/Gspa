import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/members/AuthForms";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SITE } from "@/lib/config/site";
import { tierByKey } from "@/lib/content/membership";
import { getCurrentMember } from "@/lib/members/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default async function AccountPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/members/login?next=/members/account");
  const tier = tierByKey(member.tier);
  return (
    <Section theme="light" className="pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
      <Container className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="t-eyebrow text-accent-deep">Account</p>
          <h1 className="t-hero mt-3">Your details.</h1>
          <dl className="mt-8 grid gap-4 t-body sm:grid-cols-2">
            <Row label="Name" value={`${member.firstName} ${member.lastName}`} />
            <Row label="Member number" value={member.memberNumber} mono />
            <Row label="Email" value={member.email} />
            <Row label="Phone" value={member.phone ?? "Not on file"} />
            <Row label="Tier" value={`${tier?.name ?? member.tier} · ${member.billing === "lifetime" ? "Lifetime" : "Annual"}`} />
            <Row label="Status" value={member.status} />
          </dl>
          <p className="t-caption mt-6 text-ink-muted">
            To change your name, email or phone, contact the front desk at {SITE.phone} or {SITE.email}.
          </p>
        </div>
        <div>
          <h2 className="t-2">Password</h2>
          <div className="mt-6">
            <ChangePasswordForm />
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="t-caption text-ink-muted">{label}</dt>
      <dd className={mono ? "font-mono" : "font-medium capitalize"}>{value}</dd>
    </div>
  );
}
