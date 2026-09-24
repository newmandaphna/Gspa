import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import Link from "next/link";
import { LanePerspective } from "@/components/art";
import { AvailabilityStrip } from "@/components/AvailabilityStrip";
import { DeskLog } from "@/components/DeskLog";
import { LiveStatus } from "@/components/LiveStatus";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Headline } from "@/components/ui/Headline";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { PullQuote } from "@/components/ui/PullQuote";
import { Section } from "@/components/ui/Section";
import { ExteriorArt, FloorPlan, LoungeArt, SimArt, SimulatorScreen, StepRail, SuiteArt, Waveform } from "@/components/pages/home/Art";
import { HeroArt, LaneWalk } from "@/components/pages/home/HeroMotion";
import { InView } from "@/components/pages/home/InView";
import { Tonight } from "@/components/pages/home/Tonight";
import { cn } from "@/lib/cn";
import { FACILITY, SITE, TIER_WINDOW_DAYS } from "@/lib/config/site";
import { computeOpenStatus } from "@/lib/hours";
import { tierByKey } from "@/lib/content/membership";
import { AVAILABILITY, FIRST_SESSION, HERO, HOME_META, HOSPITALITY, LANES, MEMBERSHIP, QUIET, SIMULATOR, SUITES, VISIT, spell } from "@/lib/content/pages/home";

export const metadata: Metadata = pageMeta("/", {
  title: { absolute: HOME_META.title },
  description: HOME_META.description,
});

/* Page-local helpers. Text sits still: nothing here is wrapped in a reveal. */

/** The tagline with "Relax!" italicised by hand. Nothing else on the site gets a last-word italic. */
function Tagline({ text }: { text: string }) {
  const word = "Relax!";
  if (!text.endsWith(word)) return <>{text}</>;
  return (
    <>
      {text.slice(0, -word.length)}
      <em className="t-italic text-accent">{word}</em>
    </>
  );
}

/** A photo with its caption in the left margin on lg. Mono is kept for captions that are times and prices. */
function Figure({ caption, mono = false, children, className }: { caption: string; mono?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <figure className={cn("m-0 lg:grid lg:grid-cols-12 lg:gap-6", className)}>
      <div className="lg:col-span-9 lg:col-start-4 lg:row-start-1">{children}</div>
      <figcaption className={cn("mt-3 text-muted lg:col-span-3 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:self-end", mono ? "font-mono text-[0.75rem] leading-[1.5]" : "t-caption")}>{caption}</figcaption>
    </figure>
  );
}

const ADDRESS = `${SITE.address.line1}, ${SITE.address.neighborhood}`;

export default function HomePage() {
  const status = computeOpenStatus(new Date());
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <Section as="header" theme="black" bleed id="hero" className="grain min-h-[100dvh] overflow-hidden pt-[var(--nav-h)]" aria-labelledby="hero-title">
        {/* Hero art scales and drifts with scroll (HeroMotion); the copy uses the CSS-only .enter so it paints before hydration. */}
        <HeroArt className="absolute inset-0">
          <ImageSlot slot={HERO.imageSlot} alt={HERO.imageAlt} priority className="h-full w-full" art={<LanePerspective target={false} />} />
        </HeroArt>
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0)_30%,rgba(0,0,0,0.25)_60%,rgba(0,0,0,0.9)_100%)]" />
        <Container className="relative flex min-h-[calc(100dvh-var(--nav-h))] flex-col justify-end pb-14 sm:pb-20">
          <div className="enter">
            <h1 id="hero-title" className="t-display max-w-[9em] text-snow">
              <Tagline text={HERO.headline} />
            </h1>
            {/* The address, then "Open tonight until 10." from HOURS, server-rendered and refreshed each minute. */}
            <p className="mt-6 font-mono text-[0.8125rem] uppercase leading-[1.6] tracking-[0.12em] text-mist">
              <span className="block">{ADDRESS}</span>
              <LiveStatus initial={status} field="hero" variant="line" className="block" />
            </p>
          </div>
          <div className="enter mt-8" style={{ "--enter-delay": "250ms" } as React.CSSProperties}>
            <Button href={HERO.cta.href} size="lg">
              {HERO.cta.label}
            </Button>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Quiet */}
      <Section theme="light" id="quiet" aria-labelledby="quiet-title">
        <Container>
          <Headline id="quiet-title" layout="beside" head={QUIET.captions.join(" · ")} headline={QUIET.headline} subhead={QUIET.subhead} body={QUIET.body}>
            <LinkArrow href={QUIET.link.href} className="mt-6">
              {QUIET.link.label}
            </LinkArrow>
          </Headline>
          <InView className="mt-14 sm:mt-20">
            <Waveform />
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-hairline pt-5">
              {QUIET.captions.map((c, i) => (
                <p key={c} className={cn("font-mono text-[0.75rem] uppercase tracking-[0.12em] text-ink-muted", i === 1 && "text-center", i === 2 && "text-right")}>
                  {c}
                </p>
              ))}
            </div>
          </InView>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Lanes */}
      <Section theme="dark" id="lanes" aria-labelledby="lanes-title">
        <Container>
          <Headline id="lanes-title" head={`${FACILITY.laneCount} lanes · ${FACILITY.laneYards} yd · own air`} headline={LANES.headline} subhead={LANES.subhead} body={LANES.body} />
          <div className="mt-14 sm:mt-20">
            {/* Scrolling walks the firing line: lane labels turn gold in order (HeroMotion). */}
            <LaneWalk>
              <FloorPlan laneLabel={LANES.laneLabel} />
            </LaneWalk>
          </div>
          <div className="mt-10 flex flex-col gap-4 border-t border-hairline pt-8 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
            <p className="font-mono text-[0.8125rem] leading-[1.6] text-mist">
              {LANES.priceFrom}. {LANES.eligibility}.
            </p>
            <LinkArrow href={LANES.cta.href} className="shrink-0">
              {LANES.cta.label}
            </LinkArrow>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Suites */}
      <Section theme="gray" id="suites" className="overflow-hidden" aria-labelledby="suites-title">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
            <div className="lg:col-span-5">
              <Headline id="suites-title" head={`${FACILITY.suites} suites · ${FACILITY.lanesPerSuite} lanes each · a host at the door`} headline={SUITES.headline} subhead={SUITES.subhead} body={SUITES.body}>
                <LinkArrow href={SUITES.cta.href} className="mt-6">
                  {SUITES.cta.label}
                </LinkArrow>
              </Headline>
            </div>
            <Figure caption={SUITES.caption} mono className="lg:col-span-7">
              <ImageSlot slot={SUITES.imageSlot} alt={SUITES.imageAlt} className="aspect-[16/10] rounded-card ring-1 ring-ink/5" art={<SuiteArt />} sizes="(min-width: 1024px) 640px, 100vw" />
            </Figure>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Simulator */}
      <Section theme="black" id="simulator" aria-labelledby="simulator-title">
        <Container>
          <Headline id="simulator-title" head={`${FACILITY.simulatorBays} bays · no live ammunition · ID only`} headline={SIMULATOR.headline} subhead={SIMULATOR.subhead} body={SIMULATOR.body} />
          <InView className="relative mt-14 overflow-hidden rounded-card ring-1 ring-white/10 shadow-[var(--shadow-card-dark)] sm:mt-20">
            <div className="relative aspect-[21/9]">
              <div className="absolute inset-0">
                <ImageSlot slot={SIMULATOR.imageSlot} alt={SIMULATOR.imageAlt} className="h-full w-full" art={<SimArt />} sizes="(min-width: 1180px) 1180px, 100vw" />
              </div>
              <SimulatorScreen labels={SIMULATOR.cornerLabels} />
            </div>
          </InView>
          <div className="mt-10 flex flex-col gap-5 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
            <Button href={SIMULATOR.cta.href}>{SIMULATOR.cta.label}</Button>
            <p className="font-mono text-[0.8125rem] text-mist">{SIMULATOR.eligibility}.</p>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- First Session */}
      <Section theme="light" id="first-session" aria-labelledby="first-session-title">
        <Container>
          <Headline id="first-session-title" layout="beside" head={FIRST_SESSION.price} headline={FIRST_SESSION.headline} subhead={FIRST_SESSION.subhead} body={FIRST_SESSION.body}>
            <p className="mt-4 font-mono text-[0.8125rem] text-ink-muted">{FIRST_SESSION.eligibility}.</p>
            <LinkArrow href={FIRST_SESSION.cta.href} className="mt-6">
              {FIRST_SESSION.cta.label}
            </LinkArrow>
          </Headline>
          <InView className="mt-14 sm:mt-20">
            <StepRail steps={FIRST_SESSION.steps} />
          </InView>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Hospitality */}
      <Section theme="dark" id="hospitality" aria-labelledby="hospitality-title">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
            <div className="lg:col-span-6">
              <Headline id="hospitality-title" head="Espresso, tea, sparkling water · a warm towel off the line" headline={HOSPITALITY.headline} subhead={HOSPITALITY.subhead} body={HOSPITALITY.body} />
              <PullQuote className="mt-10">No alcohol, ever.</PullQuote>
              <p className="t-footnote mt-6 text-mist">{HOSPITALITY.footnote}</p>
              <LinkArrow href={HOSPITALITY.link.href} className="mt-6">
                {HOSPITALITY.link.label}
              </LinkArrow>
            </div>
            <div className="lg:col-span-6">
              <ImageSlot slot={HOSPITALITY.imageSlot} alt={HOSPITALITY.imageAlt} className="aspect-[3/2] rounded-card ring-1 ring-white/10" art={<LoungeArt />} sizes="(min-width: 1024px) 560px, 100vw" />
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Membership */}
      <Section theme="gray" id="membership" aria-labelledby="membership-title">
        <Container>
          <Headline
            id="membership-title"
            layout="beside"
            head={`${spell(MEMBERSHIP.tiers.length)} tiers · ${TIER_WINDOW_DAYS.club}, ${TIER_WINDOW_DAYS.signature} or ${TIER_WINDOW_DAYS.founders} days ahead`}
            headline={MEMBERSHIP.headline}
            subhead={MEMBERSHIP.subhead}
            body={MEMBERSHIP.body}
          />
          {/* One hairline table, price right-aligned, in place of three matching cards. */}
          <table className="mt-14 w-full border-collapse sm:mt-20">
            <caption className="sr-only">Membership tiers, price and who each is for</caption>
            <thead>
              <tr className="border-t border-hairline">
                <th scope="col" className="py-3 pr-4 text-left font-mono text-[0.6875rem] font-normal uppercase tracking-[0.12em] text-ink-muted">
                  Tier
                </th>
                <th scope="col" className="hidden py-3 pr-4 text-left font-mono text-[0.6875rem] font-normal uppercase tracking-[0.12em] text-ink-muted md:table-cell">
                  Who it is for
                </th>
                <th scope="col" className="py-3 text-right font-mono text-[0.6875rem] font-normal uppercase tracking-[0.12em] text-ink-muted">
                  Window · price
                </th>
              </tr>
            </thead>
            <tbody>
              {MEMBERSHIP.tiers.map((t) => {
                const tier = tierByKey(t.key);
                return (
                  <tr key={t.key} className="border-t border-hairline align-baseline">
                    <th scope="row" className="py-6 pr-4 text-left font-normal sm:py-7">
                      <Link href={`/membership#tiers`} className="t-3 text-ink hover:underline hover:underline-offset-4">
                        {t.name}
                      </Link>
                      <p className="t-caption mt-1 text-ink-muted md:hidden">{tier?.forWhom ?? t.tagline}</p>
                    </th>
                    <td className="hidden py-6 pr-8 sm:py-7 md:table-cell">
                      <p className="t-body max-w-[30em] text-ink-muted">{tier?.forWhom ?? t.tagline}</p>
                      {t.limited && <p className="t-footnote mt-2 text-ink-muted">{t.limited}</p>}
                    </td>
                    <td className="py-6 text-right sm:py-7">
                      <p className="whitespace-nowrap font-mono text-[0.75rem] text-ink-muted">
                        {t.days} {MEMBERSHIP.caption}
                      </p>
                      <p className="t-3 t-price mt-1 whitespace-nowrap text-ink">{t.price}</p>
                      <p className="t-caption text-ink-muted">{t.priceNote}</p>
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t border-hairline">
                <td colSpan={3} className="p-0" aria-hidden="true" />
              </tr>
            </tbody>
          </table>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Button href={MEMBERSHIP.cta.href}>{MEMBERSHIP.cta.label}</Button>
            <p className="t-caption text-ink-muted">{MEMBERSHIP.publicWindowNote}</p>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Visit */}
      <Section theme="black" bleed id="visit" className="overflow-hidden" aria-labelledby="visit-title">
        <div className="absolute inset-0">
          <ImageSlot slot={VISIT.imageSlot} alt={VISIT.imageAlt} className="h-full w-full" art={<ExteriorArt />} />
        </div>
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.55)_50%,rgba(0,0,0,0.35)_100%)]" />
        <Container className="relative py-24 sm:py-32 lg:py-40">
          <div className="lg:max-w-[58%]">
            <Headline id="visit-title" head={`${SITE.address.line1} · ${FACILITY.transit.driveFromJfkMin} min from the terminals`} headline={VISIT.headline} subhead={VISIT.subhead} body={VISIT.body}>
              <LinkArrow href={VISIT.cta.href} className="mt-6">
                {VISIT.cta.label}
              </LinkArrow>
            </Headline>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Tonight (silent) */}
      <Section theme="light" padding="vast" id="tonight" aria-label="Lanes free tonight">
        <Container>
          <Tonight initial={status} />
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Availability */}
      <Section theme="light" padding="tight" id="availability" className="border-t border-hairline" aria-label="Live availability">
        <Container>
          <AvailabilityStrip />
          <div className="mt-8 border-t border-hairline pt-6">
            <LinkArrow href={AVAILABILITY.calendar.href}>{AVAILABILITY.calendar.label}</LinkArrow>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- From the desk */}
      <DeskLog />
    </>
  );
}
