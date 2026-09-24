import type { Metadata } from "next";
import { AvailabilityStrip } from "@/components/AvailabilityStrip";
import { GlassPanel } from "@/components/art";
import { AirFlow, ClubPhotoArt, LockerGrid, LoungeIcon, LoungePhotoArt, Scanline, ServiceTools, SuitePhotoArt, SuitePlan } from "@/components/pages/club/Art";
import { FloorPlan } from "@/components/pages/club/FloorPlan";
import { InView } from "@/components/pages/club/InView";
import { TargetRail } from "@/components/pages/club/TargetRail";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { Item, Reveal, Stagger } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";
import { ELIGIBILITY_LABELS, type Eligibility } from "@/lib/content/catalog";
import {
  CLUB_AIR,
  CLUB_AVAILABILITY_CTA,
  CLUB_HERO,
  CLUB_LOCKERS,
  CLUB_LOUNGE,
  CLUB_META,
  CLUB_PHOTO_ALT,
  CLUB_SAFETY,
  CLUB_SIMULATOR,
  CLUB_SUITES,
  CLUB_TARGETS,
  DETAILING,
  GUNSMITH,
  LOCKER_NOTE,
  LOUNGE_CAPTION,
  LOUNGE_FEATURES,
  LOUNGE_PHOTO_ALT,
  PRIVATE_SUITE,
  REQUIREMENTS_LINK,
  SERVICES_CAPTION,
  SERVICES_EYEBROW,
  SIMULATOR,
  SIMULATOR_CHIPS,
  SUITE_PHOTO_ALT,
  SUITE_PLAN_CAPTION,
  SUITE_SPECS,
  TARGET_STOPS,
  type SectionCopy,
} from "@/lib/content/pages/club";
import { RANGE_RULES } from "@/lib/content/requirements";
import { formatMoney } from "@/lib/time";

export const metadata: Metadata = {
  title: CLUB_META.title,
  description: CLUB_META.description,
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

/** Eligibility badge derived from catalog tags (never typed by hand). */
function Badge({ eligibility, tone }: { eligibility: Eligibility; tone: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center rounded-pill px-3 py-1 font-mono text-[0.75rem] ring-1 ring-inset", tone === "dark" ? "text-mist ring-white/15" : "text-ink-muted ring-ink/15")}>
      {ELIGIBILITY_LABELS[eligibility]}
    </span>
  );
}

/* --------------------------------------------------------------- page */

export default function ClubPage() {
  return (
    <>
      {/* Hero: floor plan built from FACILITY */}
      <Section theme="black" className="overflow-hidden pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
        <Container>
          <Reveal className="mx-auto max-w-[820px] text-center">
            {CLUB_HERO.eyebrow && <Eyebrow className="mb-5">{CLUB_HERO.eyebrow}</Eyebrow>}
            <h1 className="t-hero">{CLUB_HERO.headline}</h1>
            <p className="t-lead mt-2 text-mist">{CLUB_HERO.subhead}</p>
            <p className="t-body-lg mx-auto mt-6 max-w-[40em] text-mist">{CLUB_HERO.body}</p>
          </Reveal>
          <Reveal delay={0.15} className="mx-auto mt-14 max-w-[980px]">
            <FloorPlan />
          </Reveal>
          <Reveal delay={0.1} className="mt-14">
            <ImageSlot slot="CLUB_PHOTO_01" alt={CLUB_PHOTO_ALT} className="aspect-[16/9] rounded-card ring-1 ring-white/10" art={<ClubPhotoArt />} />
          </Reveal>
        </Container>
      </Section>

      {/* Air */}
      <Section theme="light" id="air">
        <Container>
          <Head copy={CLUB_AIR} />
          {CLUB_AIR.secondary && (
            <Reveal delay={0.05} className="mt-6">
              <LinkArrow href={CLUB_AIR.secondary.href}>{CLUB_AIR.secondary.label}</LinkArrow>
            </Reveal>
          )}
          <InView className="mt-14">
            <AirFlow />
          </InView>
        </Container>
      </Section>

      {/* Targets */}
      <Section theme="dark" id="targets" className="overflow-hidden">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Head copy={CLUB_TARGETS} />
            <Reveal delay={0.1}>
              <TargetRail stops={TARGET_STOPS} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Suites */}
      <Section theme="light" id="suites">
        <Container>
          <Head copy={CLUB_SUITES} />
          <Reveal delay={0.1} className="mt-12">
            <GlassPanel tone="light" className="p-5 sm:p-8 lg:p-10">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
                <div className="flex flex-col">
                  <Eyebrow>{PRIVATE_SUITE.name}</Eyebrow>
                  <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
                    {SUITE_SPECS.map((spec, i) => (
                      <li key={spec} className="flex items-baseline gap-4 py-3">
                        <span className="font-mono text-[0.75rem] text-ink-faint">0{i + 1}</span>
                        <span className="t-body">{spec}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="tabular mt-4 t-caption text-ink-muted">
                    From {formatMoney(PRIVATE_SUITE.priceCents)} for the suite
                    {PRIVATE_SUITE.memberPriceCents !== undefined && <> · members {formatMoney(PRIVATE_SUITE.memberPriceCents)}</>}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Badge eligibility={PRIVATE_SUITE.eligibility} tone="light" />
                    <LinkArrow href={REQUIREMENTS_LINK.href} className="text-[0.9375rem]">
                      {REQUIREMENTS_LINK.label}
                    </LinkArrow>
                  </div>
                  {CLUB_SUITES.cta && (
                    <div className="mt-8">
                      <Button href={CLUB_SUITES.cta.href}>{CLUB_SUITES.cta.label}</Button>
                    </div>
                  )}
                </div>
                <div>
                  <ImageSlot slot="SUITE_PHOTO_02" alt={SUITE_PHOTO_ALT} className="aspect-[16/9] rounded-card-sm lg:aspect-[21/9]" art={<SuitePhotoArt />} />
                  <div className="mt-5 flex items-center gap-4">
                    <SuitePlan className="w-28 shrink-0" />
                    <p className="t-caption text-ink-muted">{SUITE_PLAN_CAPTION}</p>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </Reveal>
        </Container>
      </Section>

      {/* Simulator */}
      <Section theme="dark" id="simulator" className="overflow-hidden">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Head copy={CLUB_SIMULATOR} />
              <Reveal delay={0.1} className="mt-6 flex flex-wrap items-center gap-3">
                <Badge eligibility={SIMULATOR.eligibility} tone="dark" />
                <LinkArrow href={REQUIREMENTS_LINK.href} className="text-[0.9375rem]">
                  {REQUIREMENTS_LINK.label}
                </LinkArrow>
              </Reveal>
              {CLUB_SIMULATOR.cta && (
                <Reveal delay={0.15} className="mt-8 flex flex-wrap items-center gap-4">
                  <Button href={CLUB_SIMULATOR.cta.href}>{CLUB_SIMULATOR.cta.label}</Button>
                  <span className="tabular t-caption text-mist">
                    {formatMoney(SIMULATOR.priceCents)} · {SIMULATOR.durationMin} minutes · up to {SIMULATOR.maxGuestsPerUnit}
                  </span>
                </Reveal>
              )}
            </div>
            <div>
              <Reveal delay={0.1}>
                <Scanline className="aspect-[4/3]" label="Bay 01" />
              </Reveal>
              <Stagger className="mt-4 flex flex-wrap gap-2">
                {SIMULATOR_CHIPS.map((chip) => (
                  <Item key={chip}>
                    <span className="glass-dark inline-flex h-9 items-center rounded-pill px-4 font-mono text-[0.8125rem] text-snow ring-1 ring-inset ring-white/10">{chip}</span>
                  </Item>
                ))}
              </Stagger>
            </div>
          </div>
        </Container>
      </Section>

      {/* Lounge */}
      <Section theme="light" id="lounge">
        <Container>
          <Head copy={CLUB_LOUNGE} />
          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
            <Reveal delay={0.1}>
              <ImageSlot slot="LOUNGE_PHOTO_02" alt={LOUNGE_PHOTO_ALT} className="aspect-[4/3] rounded-[24px] ring-1 ring-ink/5" art={<LoungePhotoArt />} />
              <p className="mt-3 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-ink-faint">{LOUNGE_CAPTION}</p>
            </Reveal>
            <Stagger className="grid grid-cols-1 border-t border-hairline sm:grid-cols-2 lg:grid-cols-1">
              {LOUNGE_FEATURES.map((f) => (
                <Item key={f.icon} className="flex items-center gap-4 border-b border-hairline py-5 text-ink sm:pr-6">
                  <LoungeIcon kind={f.icon} className="shrink-0 text-accent-deep" />
                  <span className="t-body">{f.label}</span>
                </Item>
              ))}
            </Stagger>
          </div>
        </Container>
      </Section>

      {/* Lockers and detailing */}
      <Section theme="dark" id="lockers" className="overflow-hidden">
        <Container>
          <Head copy={CLUB_LOCKERS} />
          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
            <Reveal delay={0.1}>
              <div className="rounded-card bg-night p-4 ring-1 ring-white/10 sm:p-6">
                <LockerGrid />
              </div>
              <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 t-caption text-mist">
                <span>{LOCKER_NOTE.text}</span>
                <LinkArrow href={LOCKER_NOTE.link.href} className="text-[0.875rem]">
                  {LOCKER_NOTE.link.label}
                </LinkArrow>
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <Eyebrow>{SERVICES_EYEBROW}</Eyebrow>
              <div className="mt-4 rounded-card bg-night p-4 ring-1 ring-white/10 sm:p-6">
                <ServiceTools />
              </div>
              <p className="mt-3 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-mist">{SERVICES_CAPTION}</p>
              <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
                {[GUNSMITH, DETAILING].map((s) => (
                  <li key={s.slug} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <span className="t-4">{s.name}</span>
                    <span className="t-caption text-mist">{s.tagline}</span>
                  </li>
                ))}
              </ul>
              {CLUB_LOCKERS.cta && (
                <div className="mt-6">
                  <LinkArrow href={CLUB_LOCKERS.cta.href}>{CLUB_LOCKERS.cta.label}</LinkArrow>
                </div>
              )}
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Safety */}
      <Section theme="light" id="safety">
        <Container>
          <Head copy={CLUB_SAFETY} />
          <Stagger className="mt-12 grid grid-cols-1 border-t border-hairline sm:grid-cols-2">
            {RANGE_RULES.map((rule, i) => (
              <Item key={rule} className={cn("border-b border-hairline py-8 sm:px-8", i % 2 === 0 && "sm:border-r sm:pl-0", i % 2 === 1 && "sm:pr-0")}>
                <span className="t-numeral block text-muted" aria-hidden="true">
                  0{i + 1}
                </span>
                <p className="t-3 mt-4 max-w-[18em]">
                  <span className="sr-only">Rule {i + 1}. </span>
                  {rule}
                </p>
              </Item>
            ))}
          </Stagger>
          {CLUB_SAFETY.cta && (
            <Reveal className="mt-8">
              <LinkArrow href={CLUB_SAFETY.cta.href}>{CLUB_SAFETY.cta.label}</LinkArrow>
            </Reveal>
          )}
        </Container>
      </Section>

      {/* Availability */}
      <Section theme="black">
        <Container>
          <AvailabilityStrip />
          <div className="mt-8">
            <Button href={CLUB_AVAILABILITY_CTA.href} size="lg">
              {CLUB_AVAILABILITY_CTA.label}
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
