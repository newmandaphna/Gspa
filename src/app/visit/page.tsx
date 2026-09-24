import type { Metadata } from "next";
import { AvailabilityStrip } from "@/components/AvailabilityStrip";
import { GlassPanel } from "@/components/art";
import { BringIcon, ExteriorArt, MapPin, MapPlaceholderArt, TransitSketch } from "@/components/pages/visit/Art";
import { Faq } from "@/components/pages/visit/Faq";
import { HoursTable } from "@/components/pages/visit/HoursTable";
import { InView } from "@/components/pages/visit/InView";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { Item, Reveal, Stagger } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/config/site";
import { FAQ } from "@/lib/content/faq";
import {
  BRING_ITEMS,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_HREF,
  EXTERIOR_PHOTO_ALT,
  HOURS_NOTE,
  LAST_REVIEWED_LABEL,
  MAP_EMBED_ALT,
  MAP_EMBED_LABEL,
  TRANSIT_CHIPS,
  TRANSIT_LINES,
  VISIT_AVAILABILITY_CTA,
  VISIT_BRING,
  VISIT_CONTACT,
  VISIT_FAQ,
  VISIT_HERO,
  VISIT_HOURS,
  VISIT_META,
  VISIT_REQUIREMENTS,
  VISIT_TRANSIT,
  type SectionCopy,
} from "@/lib/content/pages/visit";
import { REQUIREMENTS, REQUIREMENTS_LAST_REVIEWED } from "@/lib/content/requirements";

export const metadata: Metadata = {
  title: VISIT_META.title,
  description: VISIT_META.description,
};

/* ------------------------------------------------------------ helpers */

/** Headline block: eyebrow, headline, subhead (8px gap), body (24px of air). */
function Head({ copy, className }: { copy: SectionCopy; className?: string }) {
  return (
    <Reveal className={cn("max-w-[720px]", className)}>
      {copy.eyebrow && <Eyebrow className="mb-4">{copy.eyebrow}</Eyebrow>}
      <h2 className="t-1">{copy.headline}</h2>
      <p className="t-lead mt-2 text-muted">{copy.subhead}</p>
      {copy.body && <p className="t-body-lg mt-6 max-w-[40em] text-muted">{copy.body}</p>}
    </Reveal>
  );
}

const SCROLL_MT = "scroll-mt-[var(--nav-h)]";

/* --------------------------------------------------------------- page */

export default function VisitPage() {
  return (
    <>
      {/* Hero: full-bleed exterior with a street grid and the pin */}
      <Section theme="black" padded={false} className="flex min-h-[100dvh] items-end overflow-hidden pt-[var(--nav-h)]">
        <ImageSlot slot="EXTERIOR_PHOTO_01" alt={EXTERIOR_PHOTO_ALT} fill priority art={<ExteriorArt />} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.15)_40%,rgba(0,0,0,0.75)_100%)]" />
        <Container className="relative pb-20 pt-16 sm:pb-28">
          <Reveal className="max-w-[820px]">
            <MapPin className="mb-6 h-10 w-8" />
            {VISIT_HERO.eyebrow && <Eyebrow className="mb-4">{VISIT_HERO.eyebrow}</Eyebrow>}
            <h1 className="t-hero">{VISIT_HERO.headline}</h1>
            <p className="t-lead mt-2 text-mist">{VISIT_HERO.subhead}</p>
            {VISIT_HERO.body && <p className="t-body-lg mt-6 max-w-[40em] text-mist">{VISIT_HERO.body}</p>}
            {VISIT_HERO.cta && (
              <div className="mt-8">
                <Button href={VISIT_HERO.cta.href} target="_blank" rel="noreferrer">
                  {VISIT_HERO.cta.label}
                </Button>
              </div>
            )}
          </Reveal>
        </Container>
      </Section>

      {/* Transit */}
      <Section theme="light" id="transit" className={SCROLL_MT}>
        <Container>
          <Head copy={VISIT_TRANSIT} />
          <InView className="mt-12">
            <Reveal delay={0.1}>
              <TransitSketch lines={TRANSIT_LINES} />
            </Reveal>
          </InView>
          <Stagger className="mt-8 flex flex-wrap gap-2">
            {TRANSIT_CHIPS.map((chip) => (
              <Item key={chip}>
                <span className="inline-flex items-center rounded-pill px-3 py-1.5 font-mono text-[0.8125rem] text-ink-muted ring-1 ring-inset ring-ink/15">{chip}</span>
              </Item>
            ))}
          </Stagger>
          <Reveal delay={0.1} className="mt-12">
            <ImageSlot slot="MAP_EMBED" alt={MAP_EMBED_ALT} className="aspect-[16/9] rounded-card ring-1 ring-ink/10 sm:aspect-[21/9]" art={<MapPlaceholderArt label={MAP_EMBED_LABEL} />} />
          </Reveal>
        </Container>
      </Section>

      {/* Hours */}
      <Section theme="dark" id="hours" className={SCROLL_MT}>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <Head copy={VISIT_HOURS} />
            <Reveal delay={0.1}>
              <HoursTable />
              <p className="mt-6 font-mono text-[0.8125rem] leading-relaxed text-mist">{HOURS_NOTE}</p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* What to bring */}
      <Section theme="light" id="bring">
        <Container>
          <Head copy={VISIT_BRING} />
          {VISIT_BRING.cta && (
            <Reveal delay={0.05} className="mt-6">
              <LinkArrow href={VISIT_BRING.cta.href}>{VISIT_BRING.cta.label}</LinkArrow>
            </Reveal>
          )}
          <Stagger className="mt-14 grid grid-cols-3 gap-4 sm:gap-8">
            {BRING_ITEMS.map((b) => (
              <Item key={b.id}>
                <div className="flex flex-col items-start border-b border-hairline pb-5 text-ink">
                  <BringIcon kind={b.id} className="h-14 w-20 text-ink-muted sm:h-16 sm:w-24" />
                  <p className="t-4 mt-5">{b.caption}</p>
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </Section>

      {/* Requirements */}
      <Section theme="black" id="requirements" className={cn("grain overflow-hidden", SCROLL_MT)}>
        <Container className="relative">
          <Head copy={VISIT_REQUIREMENTS} />
          <Reveal delay={0.1} className="mt-12">
            <GlassPanel tone="dark" className="p-5 sm:p-8 lg:p-10">
              <ol className="divide-y divide-white/10">
                {REQUIREMENTS.map((r, i) => (
                  <li key={r.text} className="grid gap-3 py-5 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-4">
                    <span className="font-mono text-[0.75rem] text-accent sm:pt-1.5">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="max-w-[34em] text-[1.0625rem] leading-[1.47] text-snow">{r.text}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {r.tags.map((t) => (
                          <span key={t} className="inline-flex items-center rounded-pill px-2.5 py-0.5 font-mono text-[0.6875rem] text-mist ring-1 ring-inset ring-white/15">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-6 border-t border-white/10 pt-5 font-mono text-[0.75rem] text-mist">
                {LAST_REVIEWED_LABEL} {REQUIREMENTS_LAST_REVIEWED}
              </p>
            </GlassPanel>
          </Reveal>
        </Container>
      </Section>

      {/* FAQ */}
      <Section theme="light" id="faq" className={SCROLL_MT}>
        <Container size="md">
          <Head copy={VISIT_FAQ} />
          <Reveal delay={0.1} className="mt-12">
            <Faq items={FAQ} />
          </Reveal>
        </Container>
      </Section>

      {/* Contact */}
      <Section theme="dark" id="contact" className={cn("overflow-hidden", SCROLL_MT)}>
        <Container>
          <Head copy={VISIT_CONTACT} />
          <Reveal delay={0.1} className="mt-12 border-y border-white/10">
            <a href={CONTACT_PHONE_HREF} className="group block py-7 sm:py-9">
              <span className="t-1 tabular relative inline-block break-all after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-500 after:ease-[var(--ease-apple)] group-hover:after:scale-x-100">
                {SITE.phone}
              </span>
            </a>
            <div className="border-t border-white/10" aria-hidden="true" />
            <a href={CONTACT_EMAIL_HREF} className="group block py-7 sm:py-9">
              <span className="t-1 relative inline-block break-all after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-500 after:ease-[var(--ease-apple)] group-hover:after:scale-x-100">
                {SITE.email}
              </span>
            </a>
          </Reveal>
          {VISIT_CONTACT.secondary && (
            <Reveal delay={0.15} className="mt-6">
              <a
                href={VISIT_CONTACT.secondary.href}
                className="inline-flex items-center gap-1 text-[0.9375rem] text-mist transition-colors duration-200 hover:text-snow hover:underline hover:underline-offset-[3px]"
              >
                <span>{VISIT_CONTACT.secondary.label}</span>
                <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">
                  <path d="M2 2l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </Reveal>
          )}
        </Container>
      </Section>

      {/* Availability */}
      <Section theme="light" id="availability">
        <Container>
          <Reveal>
            <AvailabilityStrip />
            <div className="mt-8">
              <Button href={VISIT_AVAILABILITY_CTA.href}>{VISIT_AVAILABILITY_CTA.label}</Button>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
