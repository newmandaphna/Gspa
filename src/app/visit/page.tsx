import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/JsonLd";
import { faqJsonLd } from "@/lib/seo/jsonld";
import { Owner } from "@/components/ui/Owner";
import { DeskLog } from "@/components/DeskLog";
import { LiveStatus } from "@/components/LiveStatus";
import { MapEmbed } from "@/components/MapEmbed";
import { RulesCard } from "@/components/RulesCard";
import { BringIcon, ExteriorArt, MapPin, MapPlaceholderArt } from "@/components/pages/visit/Art";
import { Faq } from "@/components/pages/visit/Faq";
import { HoursTable } from "@/components/pages/visit/HoursTable";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Headline } from "@/components/ui/Headline";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { PullQuote } from "@/components/ui/PullQuote";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";
import { FACILITY, SITE } from "@/lib/config/site";
import { FAQ } from "@/lib/content/faq";
import { REQUIREMENTS, REQUIREMENTS_LAST_REVIEWED } from "@/lib/content/requirements";
import { computeOpenStatus } from "@/lib/hours";
import {
  BRING_ITEMS,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_HREF,
  EXTERIOR_PHOTO_ALT,
  HOURS_NOTE,
  VISIT_BRING,
  VISIT_CONTACT,
  VISIT_FAQ,
  VISIT_HERO,
  VISIT_HOURS,
  VISIT_META,
  VISIT_REQUIREMENTS,
  VISIT_TRANSIT,
  VISIT_WHY,
} from "@/lib/content/pages/visit";
import { HOUSE_RULES_LINK } from "@/lib/content/nav";

export const metadata: Metadata = pageMeta("/visit", {
  title: VISIT_META.title,
  description: VISIT_META.description,
});

const SCROLL_MT = "scroll-mt-[var(--nav-h)]";

/** The three ways in, as the desk says them on the phone. Bracketed minutes stay bracketed until FACILITY has them. */
const VAN_WYCK = FACILITY.transit.expressway.split(" (")[0];
const DIRECTIONS = [
  `From the JFK terminals: ${VAN_WYCK} north, ${FACILITY.transit.exit} exit, ${FACILITY.transit.driveFromJfkMin} minutes.`,
  `From Manhattan: ${VAN_WYCK} south, ${FACILITY.transit.exit} exit, ${FACILITY.transit.driveFromManhattanMin} minutes.`,
  `${FACILITY.transit.busLine} bus along Rockaway Blvd, ${FACILITY.transit.busWalkMin} minutes on foot.`,
];

/* --------------------------------------------------------------- page */

export default function VisitPage() {
  const status = computeOpenStatus(new Date());
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ)} />
      {/* Hero: full-bleed exterior with a street grid and the pin, copy at the foot */}
      <Section theme="black" padded={false} className="flex min-h-[100dvh] items-end overflow-hidden pt-[var(--nav-h)]">
        <ImageSlot slot="EXTERIOR_PHOTO_01" alt={EXTERIOR_PHOTO_ALT} fill priority art={<ExteriorArt />} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.15)_40%,rgba(0,0,0,0.75)_100%)]" />
        <Container className="relative pb-16 pt-16 sm:pb-24">
          <div className="enter max-w-[820px]">
            <MapPin className="mb-6 h-10 w-8" />
            <Headline as="h1" size="hero" head={`${SITE.address.line1} · ${FACILITY.transit.driveFromJfkMin} min from the terminals`} headline={VISIT_HERO.headline} subhead={VISIT_HERO.subhead} body={VISIT_HERO.body} />
          </div>
          {VISIT_HERO.cta && (
            <div className="enter mt-8" style={{ "--enter-delay": "250ms" } as React.CSSProperties}>
              <Button href={VISIT_HERO.cta.href} target="_blank" rel="noreferrer">
                {VISIT_HERO.cta.label}
              </Button>
            </div>
          )}
        </Container>
      </Section>

      {/* Why a runway and not a high street */}
      <Section theme="light" id="why-here" className={SCROLL_MT}>
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <Headline head={`${FACILITY.laneYards}-yard lanes · at the north fence of JFK`} headline={VISIT_WHY.headline} subhead={VISIT_WHY.subhead} />
            </div>
            <div className="space-y-5 lg:col-span-7 lg:pt-2">
              {VISIT_WHY.paragraphs.map((p) => (
                <p key={p} className="t-body-lg max-w-[40em] text-ink">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Transit: the same paper as the band above, so the alternation breaks here */}
      <Section theme="light" id="transit" className={cn("border-t border-hairline", SCROLL_MT)}>
        <Container>
          <Headline
            head={`${FACILITY.transit.driveFromJfkMin} min from JFK · ${FACILITY.transit.driveFromManhattanMin} from Manhattan · the ${FACILITY.transit.busLine} bus`}
            headline={VISIT_TRANSIT.headline}
            subhead={VISIT_TRANSIT.subhead}
            body={VISIT_TRANSIT.body}
          />
          {/* A real map, loaded on tap, with the three ways in beside it. */}
          <div className="mt-12 grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-10">
            <MapEmbed className="aspect-[16/9] rounded-card ring-1 ring-ink/10 sm:aspect-[21/9] lg:col-span-8 lg:aspect-[16/9]" poster={<MapPlaceholderArt label="" />} />
            <ul className="space-y-3 font-mono text-[0.8125rem] leading-relaxed text-ink-muted lg:col-span-4" aria-label="Directions">
              {DIRECTIONS.map((line) => (
                // A line still carrying a bracketed minute or bus route is faint in development and dropped in production.
                <Owner key={line} as="li" value={line} className="border-t border-hairline pt-3" />
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Hours */}
      <Section theme="dark" id="hours" className={SCROLL_MT}>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-10">
            <div className="lg:col-span-5">
              <Headline head={<LiveStatus initial={status} variant="line" field="short" />} headline={VISIT_HOURS.headline} subhead={VISIT_HOURS.subhead} body={VISIT_HOURS.body} />
            </div>
            <div className="lg:col-span-7">
              <HoursTable initial={status} />
              <p className="mt-6 font-mono text-[0.8125rem] leading-relaxed text-mist">{HOURS_NOTE}</p>
            </div>
          </div>
        </Container>
      </Section>

      {/* What to bring */}
      <Section theme="light" padding="tight" id="bring">
        <Container>
          <Headline layout="beside" head="Photo ID · closed-toe shoes · eye and ear protection provided" headline={VISIT_BRING.headline} subhead={VISIT_BRING.subhead} body={VISIT_BRING.body}>
            {VISIT_BRING.cta && (
              <LinkArrow href={VISIT_BRING.cta.href} className="mt-6">
                {VISIT_BRING.cta.label}
              </LinkArrow>
            )}
          </Headline>
          <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-8">
            {BRING_ITEMS.map((b) => (
              <div key={b.id} className="flex flex-col items-start border-b border-hairline pb-5 text-ink">
                <BringIcon kind={b.id} className="h-14 w-20 text-ink-muted sm:h-16 sm:w-24" />
                <p className="t-4 mt-5">{b.caption}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Requirements */}
      <Section theme="black" id="requirements" className={cn("grain overflow-hidden", SCROLL_MT)}>
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-10">
            <div className="lg:col-span-5">
              <Headline head={`${REQUIREMENTS.length} lines · reviewed ${REQUIREMENTS_LAST_REVIEWED}`} headline={VISIT_REQUIREMENTS.headline} subhead={VISIT_REQUIREMENTS.subhead} body={VISIT_REQUIREMENTS.body}>
                <LinkArrow href={HOUSE_RULES_LINK.href} className="mt-6">
                  {HOUSE_RULES_LINK.label}
                </LinkArrow>
              </Headline>
              <PullQuote className="mt-12">Nobody skips a step.</PullQuote>
            </div>
            <RulesCard className="mt-2 lg:col-span-7 lg:mt-0" />
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section theme="light" id="faq" className={SCROLL_MT}>
        <Container size="md">
          <Headline head={`${FAQ.length} questions · the desk has the long answers`} headline={VISIT_FAQ.headline} subhead={VISIT_FAQ.subhead} />
          <Faq items={FAQ} className="mt-12" />
        </Container>
      </Section>

      {/* Silent: the address alone, with the pin */}
      <Section theme="dark" padding="vast" id="address" aria-label="Address">
        <Container>
          <address className="not-italic">
            <MapPin className="mb-6 h-10 w-8" />
            <p className="t-display">{SITE.address.line1}</p>
            <p className="mt-4 font-mono text-[0.8125rem] uppercase tracking-[0.12em] text-mist">
              {SITE.address.city}, {SITE.address.state} {SITE.address.zip}
            </p>
          </address>
        </Container>
      </Section>

      {/* Contact: the page ends on the phone number. Same dark as the band above. */}
      <Section theme="dark" id="contact" className={cn("overflow-hidden border-t border-white/10", SCROLL_MT)}>
        <Container>
          <Headline head={<LiveStatus initial={status} variant="line" field="short" />} headline={VISIT_CONTACT.headline} subhead={VISIT_CONTACT.subhead} body={VISIT_CONTACT.body} />
          <div className="mt-12 border-y border-white/10">
            {/* The phone stays out of production until the owner replaces 000-0000 in site.ts; the page then ends on the email. */}
            <Owner as="div" value={SITE.phone}>
              <a href={CONTACT_PHONE_HREF} className="group block py-7 sm:py-9">
                <span className="t-display tabular relative inline-block break-all after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-500 after:ease-[var(--ease-apple)] group-hover:after:scale-x-100">
                  {SITE.phone}
                </span>
              </a>
              <div className="border-t border-white/10" aria-hidden="true" />
            </Owner>
            <a href={CONTACT_EMAIL_HREF} className="group block py-7 sm:py-9">
              <span className="t-2 relative inline-block break-all after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-500 after:ease-[var(--ease-apple)] group-hover:after:scale-x-100">
                {SITE.email}
              </span>
            </a>
          </div>
          {VISIT_CONTACT.secondary && (
            <p className="mt-6 font-mono text-[0.8125rem] text-mist">
              <a href={VISIT_CONTACT.secondary.href} className="underline underline-offset-4 transition-colors duration-200 hover:text-snow">
                {VISIT_CONTACT.secondary.label}
              </a>
            </p>
          )}
        </Container>
      </Section>

      {/* From the desk: dated lines written by whoever is on, above the footer */}
      <DeskLog />
    </>
  );
}
