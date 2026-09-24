import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminForms";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { adminConfigured, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Staff sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <Section theme="light" className="pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
      <Container size="sm">
        <p className="t-eyebrow text-accent-deep">Staff</p>
        <h1 className="t-1 mt-3">Front desk.</h1>
        <p className="t-body mt-3 text-ink-muted">Reservations, members, requests and inquiries.</p>
        {!adminConfigured() && (
          <p className="t-caption mt-6 rounded-lg bg-paper-2 px-4 py-3">
            No <code className="font-mono">ADMIN_PASSWORD</code> is set. Add one (6+ characters) to your environment — on Replit, under Tools → Secrets — and restart the app.
          </p>
        )}
        <div className="mt-8 max-w-[400px]">
          <AdminLoginForm />
        </div>
      </Container>
    </Section>
  );
}
