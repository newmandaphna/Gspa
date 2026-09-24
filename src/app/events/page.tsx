import type { Metadata } from "next";
import { Glow } from "@/components/art";
import { AvatarRow, Bracket, DateNightArt, EventsFloorPlan, EventsPhotoArt, LogoStripArt, PlanGlyph } from "@/components/pages/events/Art";
import { InquiryForm } from "@/components/pages/events/InquiryForm";
import { InView } from "@/components/pages/events/InView";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { Row, Rows, Specs } from "@/components/ui/List";
import { Item, Reveal, Stagger } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";
import { ELIGIBILITY_LABELS, type Eligibility } from "@/lib/content/catalog";
import {
  DATE_NIGHT,
  DATE_NIGHT_CHIPS,
  DATE_PHOTO_ALT,
  EVENTS_CORPORATE,
  EVENTS_DATE_NIGHT,
  EVENTS_FORMATS,
  EVENTS_HERO,
  EVENTS_INQUIRE,
  EVENTS_META,
  EVENTS_PARTIES,
  EVENTS_PHOTO_ALT,
  FORMAT_CARDS,
  FORMAT_LABELS,
  HERO_NUMERALS,
  INQUIRE_FOOTNOTE,
  LOGO_STRIP_ALT,
  LOGO_STRIP_CAPTION,
  type FormatCard,
  type SectionCopy,
} from "@/lib/content/pages/events";

export const metadata: Metadata = {
  title: EVENTS_META.title,
  description: EVENTS_META.description,
};

/* ------------------------------------------------------------ helpers */

/** Headline block: eyebrow, headline, subhead (8px gap), body (24px of air). */
function Head({ copy, align = "left", className }: { copy: SectionCopy; align?: "left" | "center"; className?: string }) {
  return (
    <Reveal className={cn("max-w-[720px]", align === "center" && "mx-auto text-center", className)}>
      {copy.eyebrow && <Eyebrow className="mb-4">{copy.eyebrow}</Eyebrow>}
      <h2 className="t-1">{copy.headline}</h2>
      <p className="t-lead mt-2 text-muted">{copy.subhead}</p>
      <p className={cn("t-body-lg mt-6 max-w-[40em] text-muted", align === "center" && "mx-auto")}>{copy.body}</p>
    </Reveal>
  );
}

/** Pill CTA plus optional secondary arrow link, 24px under the copy. */
function Ctas({ copy, className }: { copy: SectionCopy; className?: string }) {
  if (!copy.cta && !copy.secondary) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-3", className)}>
      {copy.cta && <Button href={copy.cta.href}>{copy.cta.label}</Button>}
      {copy.secondary && <LinkArrow href={copy.secondary.href}>{copy.secondary.label}</LinkArrow>}
    </div>
  );
}

/** Eligibility badge derived from catalog tags (never typed by hand). */
function Badge({ eligibility, tone }: { eligibility: Eligibility; tone: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center rounded-pill px-3 py-1 font-mono text-[0.75rem] ring-1 ring-inset", tone === "dark" ? "text-mist ring-white/15" : "text-ink-muted ring-ink/15")}>
      {ELIGIBILITY_LABELS[eligibility]}
    </span>
  );
}

/** Small status chip ("Coming") in gold, contrast-safe per band. */
function Chip({ children, tone }: { children: React.ReactNode; tone: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center rounded-pill px-3 py-1 font-mono text-[0.75rem] uppercase tracking-[0.08em] ring-1 ring-inset", tone === "dark" ? "text-accent ring-accent/40" : "text-accent-deep ring-accent-deep/40")}>
      {children}
    </span>
  );
}

function FormatCardView({ card }: { card: FormatCard }) {
  const { item } = card;
  const bookable = item.bookable;
  return (
    <article className="flex h-full flex-col rounded-card bg-paper-2 p-7 sm:p-8">
      <h3 className="t-eyebrow text-ink-muted">{item.name}</h3>
      <p className="mt-6 flex items-baseline gap-2">
        <span className="t-numeral text-[clamp(4rem,7vw,6rem)] text-ink">{item.maxGuestsPerUnit}</span>
        <span className="t-caption text-ink-muted">{FORMAT_LABELS.guests}</span>
      </p>
      <div className="mt-6">
        <PlanGlyph lanes={card.lanes} />
        <p className="mt-2 text-center font-mono text-[0.75rem] uppercase tracking-[0.08em] text-ink-muted">{FORMAT_LABELS.lanes(card.lanes)}</p>
      </div>
      <Specs
        className="mt-6"
        items={[
          { label: "Duration", value: card.duration },
          { label: "Price", value: card.price },
        ]}
      />
      <p className="t-body mt-4 text-ink-muted">{item.tagline}</p>
      <div className="mt-4">
        <Badge eligibility={item.eligibility} tone="light" />
      </div>
      {item.includes.length > 0 && (
        <Rows mark="check" size="sm" className="mt-6">
          {item.includes.map((line) => (
            <Row key={line}>{line}</Row>
          ))}
        </Rows>
      )}
      <div className="mt-8 pt-2 sm:mt-auto sm:pt-8">
        {bookable ? (
          <Button href={card.cta.href} size="md">
            {card.cta.label}
          </Button>
        ) : (
          <Button href={card.cta.href} variant="secondary" size="md">
            {card.cta.label}
          </Button>
        )}
      </div>
    </article>
  );
}

/* --------------------------------------------------------------- page */

export default function EventsPage() {
  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <Section theme="black" id="hero" className="grain overflow-hidden pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
        <ImageSlot slot="EVENTS_PHOTO_01" fill alt={EVENTS_PHOTO_ALT} art={<EventsPhotoArt />} priority />
        <Container className="relative">
          <Reveal className="mx-auto max-w-[760px] text-center">
            {EVENTS_HERO.eyebrow && <Eyebrow className="mb-4">{EVENTS_HERO.eyebrow}</Eyebrow>}
            <h1 className="t-hero">{EVENTS_HERO.headline}</h1>
            <p className="t-lead mt-2 text-mist">{EVENTS_HERO.subhead}</p>
            <p className="t-body-lg mx-auto mt-6 max-w-[40em] text-mist">{EVENTS_HERO.body}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {EVENTS_HERO.cta && (
                <Button href={EVENTS_HERO.cta.href} variant="accent" size="lg">
                  {EVENTS_HERO.cta.label}
                </Button>
              )}
              {EVENTS_HERO.secondary && <LinkArrow href={EVENTS_HERO.secondary.href}>{EVENTS_HERO.secondary.label}</LinkArrow>}
            </div>
          </Reveal>

          <Reveal delay={0.15} className="mt-14 sm:mt-20">
            <EventsFloorPlan />
          </Reveal>

          <Stagger className="mt-10 grid grid-cols-3 gap-4 sm:mt-14 sm:gap-8">
            {HERO_NUMERALS.map((n) => (
              <Item key={n.label}>
                <div className="border-t border-white/15 pt-4">
                  <p className="t-numeral text-[clamp(3.25rem,9vw,10rem)] text-accent">{n.value}</p>
                  <p className="t-caption mt-2 text-mist">{n.label}</p>
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </Section>

      {/* ------------------------------------------------------- formats */}
      <Section theme="light" id="formats">
        <Container>
          <Head copy={EVENTS_FORMATS} />
          <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
            {FORMAT_CARDS.map((card) => (
              <Item key={card.item.slug} className="h-full">
                <FormatCardView card={card} />
              </Item>
            ))}
          </Stagger>
          {EVENTS_FORMATS.cta && (
            <Reveal className="mt-10">
              <LinkArrow href={EVENTS_FORMATS.cta.href}>{EVENTS_FORMATS.cta.label}</LinkArrow>
            </Reveal>
          )}
        </Container>
      </Section>

      {/* ---------------------------------------------------- date night */}
      <Section theme="dark" id="date-night" className="overflow-hidden">
        <Glow className="-right-40 top-1/3 h-[520px] w-[520px] opacity-60" />
        <Container className="relative">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <Chip tone="dark">{EVENTS_DATE_NIGHT.eyebrow}</Chip>
              <h2 className="t-1 mt-5">{EVENTS_DATE_NIGHT.headline}</h2>
              <p className="t-lead mt-2 text-mist">{EVENTS_DATE_NIGHT.subhead}</p>
              <p className="t-body-lg mt-6 max-w-[40em] text-mist">{EVENTS_DATE_NIGHT.body}</p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {DATE_NIGHT_CHIPS.map((c) => (
                  <span key={c} className="inline-flex items-center rounded-pill px-3 py-1 font-mono text-[0.75rem] tabular text-mist ring-1 ring-inset ring-white/15">
                    {c}
                  </span>
                ))}
                <Badge eligibility={DATE_NIGHT.eligibility} tone="dark" />
              </div>
              <Ctas copy={EVENTS_DATE_NIGHT} className="mt-8" />
            </Reveal>
            <Reveal delay={0.1}>
              <InView>
                <ImageSlot slot="DATE_PHOTO_01" alt={DATE_PHOTO_ALT} className="aspect-[3/2] rounded-card ring-1 ring-white/10" art={<DateNightArt />} />
              </InView>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------- parties */}
      <Section theme="gray" id="parties">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <Head copy={EVENTS_PARTIES} />
              <Reveal delay={0.1}>
                <Ctas copy={EVENTS_PARTIES} className="mt-8" />
              </Reveal>
            </div>
            <Reveal delay={0.15}>
              <div className="rounded-card bg-paper p-7 ring-1 ring-ink/10 sm:p-10">
                <AvatarRow />
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ----------------------------------------------------- corporate */}
      <Section theme="black" id="corporate" className="grain overflow-hidden">
        <Container className="relative">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <Head copy={EVENTS_CORPORATE} />
              <Reveal delay={0.1}>
                <Ctas copy={EVENTS_CORPORATE} className="mt-8" />
              </Reveal>
            </div>
            <Reveal delay={0.15}>
              <InView as="figure" className="rounded-card bg-white/[0.03] p-5 ring-1 ring-white/10 sm:p-8">
                <Bracket />
              </InView>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="mt-14 sm:mt-20">
            <p className="mb-4 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-mist/80">{LOGO_STRIP_CAPTION}</p>
            <ImageSlot slot="CLIENT_LOGOS_01" alt={LOGO_STRIP_ALT} className="aspect-[3/1] sm:aspect-[8/1]" art={<LogoStripArt />} />
          </Reveal>
        </Container>
      </Section>

      {/* ------------------------------------------------------- inquire */}
      <Section theme="light" id="inquire" className="overflow-hidden">
        <Glow className="-left-32 top-10 h-[420px] w-[420px] opacity-50" />
        <Container size="md" className="relative">
          <Head copy={EVENTS_INQUIRE} />
          <Reveal delay={0.1} className="mt-10">
            <InquiryForm />
          </Reveal>
          <Reveal delay={0.15}>
            <p className="t-caption mt-6 text-ink-muted">
              {INQUIRE_FOOTNOTE.lead}{" "}
              <a href={`tel:${INQUIRE_FOOTNOTE.phone.replace(/[^\d+]/g, "")}`} className="tabular underline underline-offset-4 hover:text-ink">
                {INQUIRE_FOOTNOTE.phone}
              </a>
              {" · "}
              <a href={`mailto:${INQUIRE_FOOTNOTE.email}`} className="underline underline-offset-4 hover:text-ink">
                {INQUIRE_FOOTNOTE.email}
              </a>
            </p>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
