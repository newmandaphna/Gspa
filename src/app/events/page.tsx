import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { AvatarRow, Bracket, DateNightArt, EventsFloorPlan, LogoStripArt } from "@/components/pages/events/Art";
import { InquiryForm } from "@/components/pages/events/InquiryForm";
import { InView } from "@/components/pages/events/InView";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Headline } from "@/components/ui/Headline";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { Row, Rows } from "@/components/ui/List";
import { PullQuote } from "@/components/ui/PullQuote";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";
import { deskPhone, deskPhoneHref, FACILITY } from "@/lib/config/site";
import { ELIGIBILITY_LABELS } from "@/lib/content/catalog";
import {
  CORPORATE,
  CORPORATE_MIN_GUESTS,
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
  FORMAT_CARDS,
  FOUNDERS_SUITE,
  INQUIRE_FOOTNOTE,
  LOGO_STRIP_ALT,
  LOGO_STRIP_CAPTION,
  PRIVATE_SUITE,
  SHOOTERS_PER_OFFICER,
  numberWord,
  type FormatCard,
} from "@/lib/content/pages/events";

export const metadata: Metadata = pageMeta("/events", {
  title: EVENTS_META.title,
  description: EVENTS_META.description,
});

/* ------------------------------------------------------------ helpers */

/** Three widths, so the strip reads as a row of different rooms rather than three matching cards. */
const CARD_WIDTHS = ["w-[272px] sm:w-[280px]", "w-[304px] sm:w-[360px]", "w-[336px] sm:w-[440px]"];

function FormatCardView({ card, className }: { card: FormatCard; className?: string }) {
  const { item } = card;
  const facts = `Up to ${numberWord(item.maxGuestsPerUnit)} guests on ${numberWord(card.lanes)} lanes, ${card.duration}, ${card.price.toLowerCase()}.`;
  return (
    <article className={cn("flex h-full shrink-0 snap-start flex-col rounded-card bg-paper-2 p-7 sm:p-8", className)}>
      <h3 className="t-3">{item.name}</h3>
      <p className="t-subhead mt-3 text-ink-muted">{facts}</p>
      <p className="t-body mt-4 text-ink-muted">{item.tagline}</p>
      <p className="mt-3 font-mono text-[0.75rem] leading-[1.6] text-ink-muted">{ELIGIBILITY_LABELS[item.eligibility]}.</p>
      {item.includes.length > 0 && (
        <Rows mark="check" size="sm" className="mt-6">
          {item.includes.map((line) => (
            <Row key={line}>{line}</Row>
          ))}
        </Rows>
      )}
      <div className="mt-8 pt-2 sm:mt-auto sm:pt-8">
        <LinkArrow href={card.cta.href}>{card.cta.label}</LinkArrow>
      </div>
    </article>
  );
}

/* --------------------------------------------------------------- page */

export default function EventsPage() {
  return (
    <>
      {/* -------------------------------- hero: the form, because this is a lead page */}
      <Section theme="light" id="hero" className="pt-[calc(var(--nav-h)+2.5rem)] sm:pt-[calc(var(--nav-h)+3.5rem)]">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <Headline
                as="h1"
                head={`Suites for ${PRIVATE_SUITE.maxGuestsPerUnit} and ${FOUNDERS_SUITE.maxGuestsPerUnit} · the floor for ${CORPORATE.maxGuestsPerUnit} · a reply within one business day`}
                headline={EVENTS_HERO.headline}
                subhead={EVENTS_HERO.subhead}
                body={EVENTS_HERO.body}
              >
                <p className="t-caption mt-8 text-ink-muted">
                  {INQUIRE_FOOTNOTE.lead}{" "}
                  {deskPhone() && (
                    <>
                      <a href={deskPhoneHref() ?? undefined} className="tabular underline underline-offset-4 hover:text-ink">
                        {deskPhone()}
                      </a>
                      {" or "}
                    </>
                  )}
                  <a href={`mailto:${INQUIRE_FOOTNOTE.email}`} className="underline underline-offset-4 hover:text-ink">
                    {INQUIRE_FOOTNOTE.email}
                  </a>
                  .
                </p>
              </Headline>
            </div>
            <div id="inquire" className="scroll-mt-[calc(var(--nav-h)+1rem)] lg:col-span-7">
              <h2 className="t-3">{EVENTS_INQUIRE.headline}</h2>
              <p className="t-caption mt-2 text-ink-muted">
                {EVENTS_INQUIRE.subhead} {EVENTS_INQUIRE.body}
              </p>
              <InquiryForm className="mt-6" />
            </div>
          </div>
        </Container>
      </Section>

      {/* ------------------------ silent: the plan alone, bleeding off the right edge */}
      <Section theme="black" padding="vast" id="plan" className="overflow-hidden" aria-label="Floor plan">
        <Container>
          <div className="lg:w-[128%]">
            <EventsFloorPlan />
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------- formats */}
      <Section theme="light" id="formats">
        <Container>
          <Headline layout="beside" head="Suites reserve online · buyouts are quoted per group" headline={EVENTS_FORMATS.headline} subhead={EVENTS_FORMATS.subhead} body={EVENTS_FORMATS.body}>
            {EVENTS_FORMATS.cta && (
              <LinkArrow href={EVENTS_FORMATS.cta.href} className="mt-6">
                {EVENTS_FORMATS.cta.label}
              </LinkArrow>
            )}
          </Headline>
          {/* A horizontal strip at three widths; it scrolls where it does not fit. */}
          <div className="no-scrollbar -mx-5 mt-12 flex snap-x gap-4 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
            {FORMAT_CARDS.map((card, i) => (
              <FormatCardView key={card.item.slug} card={card} className={CARD_WIDTHS[i] ?? CARD_WIDTHS[0]} />
            ))}
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------- date night */}
      <Section theme="light" padding="tight" id="date-night" className="border-t border-hairline">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-6">
              <Headline head={`Coming · ${DATE_NIGHT_CHIPS.join(" · ")}`} headline={EVENTS_DATE_NIGHT.headline} subhead={EVENTS_DATE_NIGHT.subhead} body={EVENTS_DATE_NIGHT.body}>
                <p className="mt-4 font-mono text-[0.8125rem] leading-[1.6] text-ink-muted">{ELIGIBILITY_LABELS[DATE_NIGHT.eligibility]}.</p>
                {EVENTS_DATE_NIGHT.cta && (
                  <LinkArrow href={EVENTS_DATE_NIGHT.cta.href} className="mt-6">
                    {EVENTS_DATE_NIGHT.cta.label}
                  </LinkArrow>
                )}
              </Headline>
            </div>
            <InView className="lg:col-span-6">
              <ImageSlot slot="DATE_PHOTO_01" alt={DATE_PHOTO_ALT} className="aspect-[3/2] rounded-card ring-1 ring-ink/10" art={<DateNightArt />} sizes="(min-width: 1024px) 560px, 100vw" />
            </InView>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------- parties */}
      <Section theme="gray" id="parties">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-6">
              <Headline head={`One range officer per ${SHOOTERS_PER_OFFICER} shooters · a host on every party`} headline={EVENTS_PARTIES.headline} subhead={EVENTS_PARTIES.subhead} body={EVENTS_PARTIES.body}>
                {EVENTS_PARTIES.cta && (
                  <div className="mt-8">
                    <Button href={EVENTS_PARTIES.cta.href}>{EVENTS_PARTIES.cta.label}</Button>
                  </div>
                )}
              </Headline>
            </div>
            <div className="lg:col-span-6">
              <div className="rounded-card bg-paper p-7 ring-1 ring-ink/10 sm:p-10">
                <AvatarRow />
              </div>
            </div>
          </div>
          <PullQuote className="mt-14 sm:mt-20">No alcohol, ever.</PullQuote>
        </Container>
      </Section>

      {/* ------------------------------------------ corporate: the page ends here */}
      <Section theme="black" id="corporate" className="grain overflow-hidden">
        <Container className="relative">
          <Headline layout="beside" head={`${CORPORATE_MIN_GUESTS} to ${CORPORATE.maxGuestsPerUnit} guests · ${FACILITY.laneCount} lanes and ${FACILITY.simulatorBays} bays · quoted per group`} headline={EVENTS_CORPORATE.headline} subhead={EVENTS_CORPORATE.subhead} body={EVENTS_CORPORATE.body}>
            {EVENTS_CORPORATE.cta && (
              <div className="mt-8">
                <Button href={EVENTS_CORPORATE.cta.href}>{EVENTS_CORPORATE.cta.label}</Button>
              </div>
            )}
          </Headline>
          <InView as="figure" className="m-0 mt-14 rounded-card bg-white/[0.03] p-5 ring-1 ring-white/10 sm:mt-20 sm:p-8 lg:ml-[41.667%]">
            <Bracket />
          </InView>
          <div className="mt-14 sm:mt-20">
            <p className="mb-4 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-mist">{LOGO_STRIP_CAPTION}</p>
            <ImageSlot slot="CLIENT_LOGOS_01" alt={LOGO_STRIP_ALT} className="aspect-[3/1] sm:aspect-[8/1]" art={<LogoStripArt />} />
          </div>
        </Container>
      </Section>
    </>
  );
}
