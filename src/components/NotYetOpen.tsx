import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Render } from "@/components/ui/Render";
import { Section } from "@/components/ui/Section";
import { SITE } from "@/lib/config/site";

/**
 * What /reserve and /training/classes show before opening day (SITE.openForBusiness).
 * Nothing on it takes a booking; it points to the two things that are open now.
 */
export function NotYetOpen({ what }: { what: string }) {
  return (
    <Section theme="black" bleed aria-labelledby="not-yet-open-title" className="relative flex min-h-[100svh] items-end overflow-hidden">
      <Render name="lineup" priority className="-scale-x-100 opacity-60" position="0% 60%" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,11,0.95)_0%,rgba(10,10,11,0.75)_40%,rgba(10,10,11,0.15)_75%)] max-md:bg-[linear-gradient(0deg,rgba(10,10,11,0.95)_0%,rgba(10,10,11,0.7)_50%,rgba(10,10,11,0.2)_100%)]" />
      <Container className="relative pb-16 pt-[calc(var(--nav-h)+4rem)] sm:pb-24">
        <p className="t-eyebrow text-mist">{what}</p>
        <h1 id="not-yet-open-title" className="mt-6 text-snow">
          <span className="t-display block">Opening</span>
          <span className="t-accent -mt-[0.08em] block pl-[0.04em] text-[clamp(4rem,10vw,9rem)] leading-[0.8]">soon.</span>
        </h1>
        <p className="t-body-lg mt-8 max-w-[32em] text-mist">
          We are not taking reservations yet. Membership applications are open now, and members hear first when the calendar opens.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Button href="/membership" variant="accent" size="lg">
            Membership
          </Button>
          <a href={`mailto:${SITE.email}`} className="link-arrow text-snow">
            {SITE.email}
          </a>
        </div>
      </Container>
    </Section>
  );
}
