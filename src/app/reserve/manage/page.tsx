import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getBookingByCode } from "@/lib/booking";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Manage a reservation", robots: { index: false } };

export default async function ManagePage({ searchParams }: { searchParams: Promise<{ code?: string; email?: string; err?: string }> }) {
  const { code, email, err } = await searchParams;

  if (code && email) {
    const found = await getBookingByCode(code);
    if (found && found.booking.email === email.trim().toLowerCase()) redirect(`/reserve/confirmation/${found.booking.code}`);
    redirect(`/reserve/manage?err=1`);
  }

  return (
    <Section theme="light" className="pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
      <Container size="sm">
        <h1 className="t-hero">Find your reservation.</h1>
        <p className="t-lead mt-4 text-ink-muted">Enter the confirmation code from your email and the address it was sent to.</p>
        <form method="get" className="mt-10 grid gap-4">
          <div>
            <label htmlFor="code" className="t-caption font-semibold">
              Confirmation code
            </label>
            <input id="code" name="code" required placeholder="GS-XXXXXX" autoCapitalize="characters" className="mt-2 h-12 w-full rounded-xl bg-white px-4 font-mono text-[1.0625rem] uppercase ring-1 ring-inset ring-ink/15 focus:ring-ink" />
          </div>
          <div>
            <label htmlFor="email" className="t-caption font-semibold">
              Email
            </label>
            <input id="email" name="email" type="email" required className="mt-2 h-12 w-full rounded-xl bg-white px-4 text-[1.0625rem] ring-1 ring-inset ring-ink/15 focus:ring-ink" />
          </div>
          {err && (
            <p role="alert" className="t-body rounded-xl bg-[#fff2f0] px-4 py-3 text-[#c0392b]">
              We couldn&apos;t find a reservation with that code and email.
            </p>
          )}
          <div>
            <Button type="submit" size="lg">
              Look up
            </Button>
          </div>
        </form>
      </Container>
    </Section>
  );
}
