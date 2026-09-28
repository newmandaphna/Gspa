import { InterestForm } from "@/components/pages/membership/InterestForm";
import { Container } from "@/components/ui/Container";
import { Render } from "@/components/ui/Render";
import { Section } from "@/components/ui/Section";
import { LANDING } from "@/lib/content/pages/membership";

/** The one page the public sees in landing-only mode (SITE.landingOnly): who the club is for, and the list. */
export function Landing() {
  return (
    <Section theme="black" bleed aria-labelledby="landing-title" className="relative overflow-hidden">
      <Render name="casings" priority className="opacity-50" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,11,0.97)_0%,rgba(10,10,11,0.85)_55%,rgba(10,10,11,0.55)_100%)]" />
      <Container className="relative grid min-h-[100svh] gap-14 pb-20 pt-32 lg:grid-cols-12 lg:items-center lg:gap-10 lg:pt-28">
        <div className="lg:col-span-6">
          <p className="t-eyebrow text-mist">{LANDING.eyebrow}</p>
          <h1 id="landing-title" className="t-hero mt-6 max-w-[13em] text-snow [word-break:normal] lg:text-[clamp(2.75rem,4.4vw,4.5rem)]">
            {LANDING.headline}
          </h1>
          <p className="t-body-lg mt-8 max-w-[30em] text-mist">{LANDING.body}</p>
        </div>
        <div id="join" className="scroll-mt-24 lg:col-span-6">
          <h2 className="t-2 text-snow">{LANDING.formHeadline}</h2>
          <p className="t-body mt-3 max-w-[30em] text-mist">{LANDING.formBody}</p>
          <InterestForm idPrefix="landing" className="mt-8 bg-night/70 backdrop-blur-sm" />
        </div>
      </Container>
    </Section>
  );
}
