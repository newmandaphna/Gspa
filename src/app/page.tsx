import type { Metadata } from "next";
import Link from "next/link";
import { LanePerspective, GlassPanel, Glow } from "@/components/art";
import { AvailabilityStrip } from "@/components/AvailabilityStrip";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { Item, Reveal, Stagger } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { ExteriorArt, FloorPlan, HospitalityIcon, LoungeArt, SimArt, SimulatorScreen, StepRail, SuiteArt, SuitePlan, TransitSketch, Waveform } from "@/components/pages/home/Art";
import { InView } from "@/components/pages/home/InView";
import { cn } from "@/lib/cn";
import { AVAILABILITY, FIRST_SESSION, HERO, HOME_META, HOSPITALITY, LANES, MEMBERSHIP, QUIET, SIMULATOR, SUITES, VISIT } from "@/lib/content/pages/home";

export const metadata: Metadata = {
  title: { absolute: HOME_META.title },
  description: HOME_META.description,
};

/* Local helpers (page-only). Gold small text on light must be accent-deep for contrast. */

function Kicker({ children, tone }: { children: React.ReactNode; tone: "light" | "dark" }) {
  return <p className={cn("t-eyebrow", tone === "dark" ? "text-accent" : "text-accent-deep")}>{children}</p>;
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "light" | "dark" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-[0.8125rem] ring-1 ring-inset",
        tone === "dark" ? "text-mist ring-white/15" : "text-ink-muted ring-ink/15",
      )}
    >
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", tone === "dark" ? "bg-accent" : "bg-accent-deep")} />
      {children}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="glass-dark inline-flex items-center rounded-pill px-3.5 py-1.5 font-mono text-[0.8125rem] text-snow ring-1 ring-white/10">{children}</span>;
}

function Headline({
  kicker,
  headline,
  subhead,
  body,
  tone,
  id,
  center = false,
  className,
}: {
  kicker: string;
  headline: string;
  subhead: string;
  body?: string;
  tone: "light" | "dark";
  id: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <Reveal className={cn("max-w-[720px]", center && "mx-auto text-center", className)}>
      <Kicker tone={tone}>{kicker}</Kicker>
      <h2 id={`${id}-title`} className="t-1 mt-4">
        {headline}
      </h2>
      <p className="t-lead mt-2 text-muted">{subhead}</p>
      {body && <p className="t-body-lg mt-6 max-w-[40em] text-muted">{body}</p>}
    </Reveal>
  );
}

function HeroHeadline({ text }: { text: string }) {
  const i = text.lastIndexOf(" ");
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i + 1)}
      <span className="text-accent">{text.slice(i + 1)}</span>
    </>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <Section as="header" theme="black" bleed id="hero" className="grain min-h-[100dvh] overflow-hidden pt-[var(--nav-h)]" aria-labelledby="hero-title">
        <div className="absolute inset-0">
          <ImageSlot slot={HERO.imageSlot} alt={HERO.imageAlt} priority className="h-full w-full" art={<LanePerspective />} />
        </div>
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0)_35%,rgba(0,0,0,0.15)_70%,rgba(0,0,0,0.85)_100%)]" />
        <Container className="relative flex min-h-[calc(100dvh-var(--nav-h))] flex-col items-center justify-center py-20 text-center">
          <Reveal>
            <div className="flex justify-center text-[1.25rem] text-snow sm:text-[1.5rem]">
              <Wordmark tone="current" />
            </div>
            <h1 id="hero-title" className="t-display mt-8 text-snow">
              <HeroHeadline text={HERO.headline} />
            </h1>
            <p className="t-lead mt-3 text-mist">{HERO.subhead}</p>
            <p className="t-body-lg mx-auto mt-6 max-w-[40em] text-mist/85">{HERO.body}</p>
          </Reveal>
          <Reveal delay={0.25} className="mt-10 flex flex-col items-center gap-5">
            <Button href={HERO.cta.href} size="lg">
              {HERO.cta.label}
            </Button>
            <LinkArrow href={HERO.link.href}>{HERO.link.label}</LinkArrow>
          </Reveal>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Quiet */}
      <Section theme="light" id="quiet" aria-labelledby="quiet-title">
        <Container size="md">
          <Headline id="quiet" tone="light" kicker={QUIET.eyebrow} headline={QUIET.headline} subhead={QUIET.subhead} body={QUIET.body} center />
          <Reveal className="mt-14 sm:mt-20">
            <InView>
              <Waveform />
              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-hairline pt-5">
                {QUIET.captions.map((c, i) => (
                  <p key={c} className={cn("t-eyebrow text-ink-muted", i === 0 && "text-left", i === 1 && "text-center", i === 2 && "text-right")}>
                    {c}
                  </p>
                ))}
              </div>
            </InView>
          </Reveal>
          <Reveal delay={0.1} className="mt-10 flex justify-center">
            <LinkArrow href={QUIET.link.href}>{QUIET.link.label}</LinkArrow>
          </Reveal>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Lanes */}
      <Section theme="dark" id="lanes" aria-labelledby="lanes-title">
        <Container size="lg">
          <Headline id="lanes" tone="dark" kicker={LANES.eyebrow} headline={LANES.headline} subhead={LANES.subhead} body={LANES.body} />
          <Reveal className="mt-14 sm:mt-20">
            <FloorPlan laneLabel={LANES.laneLabel} />
          </Reveal>
          <Stagger className="mt-10 flex flex-wrap items-center gap-2.5">
            {LANES.chips.map((c) => (
              <Item key={c}>
                <Chip>{c}</Chip>
              </Item>
            ))}
          </Stagger>
          <Reveal delay={0.1} className="mt-10 flex flex-col gap-5 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <Button href={LANES.cta.href}>{LANES.cta.label}</Button>
              <Badge tone="dark">{LANES.eligibility}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="t-caption tabular text-muted">{LANES.priceFrom}</span>
              <LinkArrow href={LANES.requirements.href} className="text-[0.9375rem]">
                {LANES.requirements.label}
              </LinkArrow>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Suites */}
      <Section theme="gray" id="suites" className="overflow-hidden" aria-labelledby="suites-title">
        <Container size="lg">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <Headline id="suites" tone="light" kicker={SUITES.eyebrow} headline={SUITES.headline} subhead={SUITES.subhead} body={SUITES.body} />
              <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center gap-5">
                <Button href={SUITES.cta.href}>{SUITES.cta.label}</Button>
                <LinkArrow href={SUITES.link.href}>{SUITES.link.label}</LinkArrow>
              </Reveal>
            </div>
            <Reveal className="relative">
              <Glow variant="accent" className="-left-[10%] -top-[10%] h-[120%] w-[120%] opacity-30" />
              <InView className="relative">
                <GlassPanel tone="light" className="p-6 sm:p-8">
                  <SuitePlan />
                </GlassPanel>
              </InView>
              <figure className="relative mt-5">
                <ImageSlot slot={SUITES.imageSlot} alt={SUITES.imageAlt} className="aspect-[16/10] rounded-card ring-1 ring-ink/5" art={<SuiteArt />} sizes="(min-width: 1024px) 560px, 100vw" />
                <figcaption className="mt-3 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-ink-faint">{SUITES.caption}</figcaption>
              </figure>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Simulator */}
      <Section theme="black" id="simulator" aria-labelledby="simulator-title">
        <Container size="lg">
          <Headline id="simulator" tone="dark" kicker={SIMULATOR.eyebrow} headline={SIMULATOR.headline} subhead={SIMULATOR.subhead} body={SIMULATOR.body} />
          <Reveal className="mt-14 sm:mt-20">
            <InView className="relative overflow-hidden rounded-card ring-1 ring-white/10 shadow-[var(--shadow-card-dark)]">
              <div className="relative aspect-[21/9]">
                <div className="absolute inset-0">
                  <ImageSlot slot={SIMULATOR.imageSlot} alt={SIMULATOR.imageAlt} className="h-full w-full" art={<SimArt />} sizes="(min-width: 1180px) 1180px, 100vw" />
                </div>
                <SimulatorScreen labels={SIMULATOR.cornerLabels} />
              </div>
            </InView>
          </Reveal>
          <Reveal delay={0.1} className="mt-10 flex flex-col gap-5 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <Button href={SIMULATOR.cta.href}>{SIMULATOR.cta.label}</Button>
              <Badge tone="dark">{SIMULATOR.eligibility}</Badge>
            </div>
            <LinkArrow href={SIMULATOR.requirements.href} className="text-[0.9375rem]">
              {SIMULATOR.requirements.label}
            </LinkArrow>
          </Reveal>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- First Session */}
      <Section theme="light" id="first-session" aria-labelledby="first-session-title">
        <Container size="md">
          <Headline id="first-session" tone="light" kicker={FIRST_SESSION.eyebrow} headline={FIRST_SESSION.headline} subhead={FIRST_SESSION.subhead} body={FIRST_SESSION.body} />
          <Reveal className="mt-14 sm:mt-20">
            <InView>
              <StepRail steps={FIRST_SESSION.steps} />
            </InView>
          </Reveal>
          <Reveal delay={0.1} className="mt-14 flex flex-col gap-5 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <Button href={FIRST_SESSION.cta.href}>{FIRST_SESSION.cta.label}</Button>
              <Badge tone="light">{FIRST_SESSION.eligibility}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="t-caption tabular text-ink-muted">{FIRST_SESSION.price}</span>
              <LinkArrow href={FIRST_SESSION.requirements.href} className="text-[0.9375rem]">
                {FIRST_SESSION.requirements.label}
              </LinkArrow>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Hospitality */}
      <Section theme="dark" id="hospitality" aria-labelledby="hospitality-title">
        <Container size="lg">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
            <div>
              <Headline id="hospitality" tone="dark" kicker={HOSPITALITY.eyebrow} headline={HOSPITALITY.headline} subhead={HOSPITALITY.subhead} body={HOSPITALITY.body} />
              <Reveal className="mt-12">
                <InView>
                  <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
                    {HOSPITALITY.items.map((it, i) => (
                      <li key={it.key} className="text-snow">
                        <HospitalityIcon icon={it.key} delay={i * 0.14} />
                        <p className="t-eyebrow mt-4 text-snow">{it.label}</p>
                        <p className="t-footnote mt-1 text-muted">{it.note}</p>
                      </li>
                    ))}
                  </ul>
                </InView>
                <p className="t-footnote mt-8 text-muted">{HOSPITALITY.footnote}</p>
              </Reveal>
              <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
                <LinkArrow href={HOSPITALITY.link.href}>{HOSPITALITY.link.label}</LinkArrow>
                <LinkArrow href={HOSPITALITY.membersLink.href}>{HOSPITALITY.membersLink.label}</LinkArrow>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <ImageSlot slot={HOSPITALITY.imageSlot} alt={HOSPITALITY.imageAlt} className="aspect-[3/2] rounded-card ring-1 ring-white/10" art={<LoungeArt />} sizes="(min-width: 1024px) 520px, 100vw" />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Membership */}
      <Section theme="gray" id="membership" aria-labelledby="membership-title">
        <Container size="lg">
          <Headline id="membership" tone="light" kicker={MEMBERSHIP.eyebrow} headline={MEMBERSHIP.headline} subhead={MEMBERSHIP.subhead} body={MEMBERSHIP.body} center />
          <Stagger className="mt-14 grid gap-5 sm:mt-20 lg:grid-cols-3 lg:items-end lg:gap-6">
            {MEMBERSHIP.tiers.map((t) => (
              <Item key={t.key}>
                <Link
                  href={MEMBERSHIP.cta.href}
                  className={cn(
                    "group relative block overflow-hidden rounded-card bg-paper p-7 ring-1 ring-ink/5 transition-[transform,box-shadow] duration-300 ease-[var(--ease-apple)] hover:-translate-y-1 hover:shadow-[var(--shadow-card)] sm:p-9",
                    t.highlight && "shadow-[var(--shadow-card)] lg:-translate-y-2 lg:hover:-translate-y-3",
                  )}
                >
                  {t.highlight && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-accent" />}
                  <p className="t-numeral tabular text-ink">{t.days}</p>
                  <p className="t-eyebrow mt-2 text-ink-muted">{MEMBERSHIP.caption}</p>
                  <div className="mt-8 flex items-baseline justify-between gap-4 border-t border-hairline pt-6">
                    <h3 className="t-3">{t.name}</h3>
                    <p className="tabular text-right text-ink-muted">
                      <span className="t-body font-medium text-ink">{t.price}</span> <span className="t-caption">{t.priceNote}</span>
                    </p>
                  </div>
                  <p className="t-body mt-3 text-ink-muted">{t.tagline}</p>
                  {t.limited && <p className="t-footnote mt-3 text-accent-deep">{t.limited}</p>}
                </Link>
              </Item>
            ))}
          </Stagger>
          <Reveal delay={0.1} className="mt-12 flex flex-col items-center gap-4 text-center">
            <Button href={MEMBERSHIP.cta.href}>{MEMBERSHIP.cta.label}</Button>
            <p className="t-caption text-ink-faint">{MEMBERSHIP.publicWindowNote}</p>
          </Reveal>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Visit */}
      <Section theme="black" bleed id="visit" className="overflow-hidden" aria-labelledby="visit-title">
        <div className="absolute inset-0">
          <ImageSlot slot={VISIT.imageSlot} alt={VISIT.imageAlt} className="h-full w-full" art={<ExteriorArt />} />
        </div>
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.55)_50%,rgba(0,0,0,0.35)_100%)]" />
        <Container size="lg" className="relative py-24 sm:py-32 lg:py-40">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <Headline id="visit" tone="dark" kicker={VISIT.eyebrow} headline={VISIT.headline} subhead={VISIT.subhead} body={VISIT.body} />
              <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center gap-5">
                <Button href={VISIT.cta.href}>{VISIT.cta.label}</Button>
                <LinkArrow href={VISIT.hoursLink.href}>{VISIT.hoursLink.label}</LinkArrow>
              </Reveal>
            </div>
            <Reveal delay={0.15}>
              <InView className="px-2 py-6 sm:px-4">
                <TransitSketch stations={VISIT.stations} pin={VISIT.pin} />
              </InView>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Availability */}
      <Section theme="light" id="availability" aria-label="Live availability">
        <Container size="md">
          <Reveal>
            <AvailabilityStrip />
          </Reveal>
          <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-hairline pt-6">
            <LinkArrow href={AVAILABILITY.calendar.href}>{AVAILABILITY.calendar.label}</LinkArrow>
            <LinkArrow href={AVAILABILITY.requirements.href} className="text-[0.9375rem]">
              {AVAILABILITY.requirements.label}
            </LinkArrow>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
