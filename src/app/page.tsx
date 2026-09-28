import type { Metadata } from "next";
import Image from "next/image";
import { pageMeta } from "@/lib/seo/meta";
import { Landing } from "@/components/landing/Landing";
import { isAdmin } from "@/lib/auth";
import { AvailabilityStrip } from "@/components/AvailabilityStrip";
import { DeskLog } from "@/components/DeskLog";
import { LiveStatus } from "@/components/LiveStatus";
import { LaneBoard } from "@/components/fun/LaneBoard";
import { Marquee } from "@/components/fun/Marquee";
import { RangeTimer } from "@/components/fun/RangeTimer";
import { TargetPractice } from "@/components/fun/TargetPractice";
import { CartridgeHero } from "@/components/three/CartridgeHero";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { Section } from "@/components/ui/Section";
import { Tonight } from "@/components/pages/home/Tonight";
import { UpcomingClasses } from "@/components/pages/home/UpcomingClasses";
import { FACILITY, SITE } from "@/lib/config/site";
import { computeOpenStatus } from "@/lib/hours";
import { itemBySlug } from "@/lib/content/catalog";
import { formatMoney } from "@/lib/time";
import { AVAILABILITY, HERO, HOME_META, HOSPITALITY, LANES, QUIET, SUITES, VISIT, spell } from "@/lib/content/pages/home";
import { PRICES_PUBLIC } from "@/lib/pricing";
import { LANDING, MEMBERSHIP_PRELAUNCH } from "@/lib/content/pages/membership";
import { TRAINING_PRELAUNCH } from "@/lib/content/pages/training";

export const metadata: Metadata = pageMeta("/", {
  title: { absolute: SITE.landingOnly ? LANDING.meta.title : HOME_META.title },
  description: SITE.landingOnly ? LANDING.meta.description : HOME_META.description,
});

/** Headline stack for this page: running head, capitals headline, Bodoni subhead. */
function Head({ id, head, headline, subhead, className, as: Tag = "h2" }: { id: string; head?: string; headline: React.ReactNode; subhead?: React.ReactNode; className?: string; as?: "h1" | "h2" }) {
  return (
    <div className={className}>
      {head && <Eyebrow className="mb-6">{head}</Eyebrow>}
      <Tag id={id} className="t-1 max-w-[15em]">
        {headline}
      </Tag>
      {subhead && <p className="t-subhead mt-5 max-w-[22em] text-muted">{subhead}</p>}
    </div>
  );
}

const SUITE = itemBySlug("private-suite");

const TICKER = [
  ...(SITE.facilityDetailsPublic
    ? [`${FACILITY.laneCount} lanes`, `${FACILITY.laneYards} yards`, `${spell(FACILITY.suites)} private suites`, `${spell(FACILITY.simulatorBays)} simulator bays`]
    : [SITE.area, "Membership by application", "Instruction for every level", SITE.tagline]),
  "Espresso, never alcohol",
  `${FACILITY.transit.driveFromJfkMin} minutes from JFK`,
  "Warm towels off the line",
  ...(SITE.address.public ? [SITE.address.line1] : []),
];

const LOUNGE_MENU = [
  { item: "Espresso", note: "Pulled to order" },
  { item: "Tea", note: "Loose leaf" },
  { item: "Sparkling water", note: "Always cold" },
  { item: "A warm towel", note: "Off the line" },
];

export default async function HomePage() {
  // Landing-only mode: the public sees the sign-up; a signed-in admin sees the full home page.
  if (SITE.landingOnly && !(await isAdmin().catch(() => false))) return <Landing />;
  const status = computeOpenStatus(new Date());
  return (
    <>
      {/* ---------------------------------------------------------------- Hero: the round from the logo, lit */}
      <Section as="header" theme="black" bleed id="hero" className="relative min-h-[100svh] overflow-hidden" aria-labelledby="hero-title">
        <CartridgeHero anchor={0.8} className="cursor-pointer" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,11,0.85)_0%,rgba(10,10,11,0.2)_45%,rgba(10,10,11,0)_60%)] max-md:bg-[linear-gradient(0deg,rgba(10,10,11,0.95)_0%,rgba(10,10,11,0.7)_38%,rgba(10,10,11,0)_62%)]" />
        <Container className="pointer-events-none relative flex min-h-[100svh] flex-col justify-end pb-12 pt-[calc(var(--nav-h)+2rem)] sm:pb-20">
          <div className="enter pointer-events-auto">
            <p className="t-eyebrow text-mist">{SITE.address.public ? `${SITE.address.line1} · ${SITE.address.neighborhood}` : SITE.area}</p>
            <h1 id="hero-title" className="mt-6 text-snow">
              <span className="t-display block lg:text-[clamp(5rem,6.8vw,6.6rem)]">Ready? Aim.</span>
              <span className="t-accent -mt-[0.05em] block pl-[0.04em] text-[clamp(4.5rem,12.5vw,11.5rem)] leading-[0.82]">Relax!</span>
            </h1>
          </div>
          <div className="enter pointer-events-auto mt-10 flex flex-wrap items-center gap-x-8 gap-y-5" style={{ "--enter-delay": "220ms" } as React.CSSProperties}>
            <Button href={HERO.cta.href} size="lg" variant="accent">
              {HERO.cta.label}
            </Button>
            <LinkArrow href={HERO.link.href}>{HERO.link.label}</LinkArrow>
            <LiveStatus initial={status} field="hero" variant="line" className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-mist sm:ml-auto" />
          </div>
        </Container>
        <p aria-hidden="true" className="pointer-events-none absolute bottom-6 right-6 hidden font-mono text-[0.625rem] uppercase tracking-[0.2em] text-night-4 md:block">
          9 mm Luger · tap the round
        </p>
      </Section>

      {/* ---------------------------------------------------------------- Ticker */}
      <div className="border-y border-black/20 bg-accent py-3.5 text-night">
        <Marquee items={TICKER} className="t-label text-[0.8125rem]" />
      </div>

      {/* ---------------------------------------------------------------- Take a shot */}
      <Section theme="light" padding="vast" id="take-a-shot" aria-label="Target practice">
        <Container>
          <TargetPractice ctaHref={LANES.cta.href} />
        </Container>
      </Section>

      {/* Lanes, the quiet room, and the suites describe the built space: shown only with SITE.facilityDetailsPublic. */}
      {SITE.facilityDetailsPublic && (
        <>
      {/* ---------------------------------------------------------------- Lanes */}
      <Section theme="black" id="lanes" aria-labelledby="lanes-title" className="overflow-hidden">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <Head id="lanes-title" className="lg:col-span-7" head={`${FACILITY.laneCount} lanes · ${FACILITY.laneYards} yd · own air`} headline={LANES.headline} subhead={LANES.subhead} />
            <div className="lg:col-span-5">
              <p className="t-body-lg text-mist">{LANES.body}</p>
              <p className="mt-5 font-mono text-[0.75rem] leading-[1.7] tracking-[0.04em] text-mist">
                {LANES.priceFrom}. {LANES.eligibility}.
              </p>
            </div>
          </div>
          <div className="mt-16 sm:mt-24">
            <LaneBoard count={FACILITY.laneCount} yards={FACILITY.laneYards} href="/reserve?experience=lane-session&lane={lane}" />
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-8">
            <Button href={LANES.cta.href}>{LANES.cta.label}</Button>
            <LinkArrow href={QUIET.link.href}>{QUIET.link.label}</LinkArrow>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Quiet: one sentence, big */}
      <Section theme="light" padding="vast" id="quiet" aria-labelledby="quiet-title">
        <Container>
          <Eyebrow>{QUIET.captions.join(" · ")}</Eyebrow>
          <h2 id="quiet-title" className="mt-8 max-w-[18ch] font-serif text-[clamp(2.6rem,6.8vw,6.25rem)] italic leading-[0.98] tracking-[-0.02em]">
            {QUIET.subhead}
          </h2>
          <div className="mt-12 grid gap-8 border-t border-hairline pt-8 md:grid-cols-12">
            <p className="t-body-lg text-ink-muted md:col-span-6">{QUIET.body}</p>
            <div className="md:col-span-6 md:text-right">
              <LinkArrow href={QUIET.link.href}>{QUIET.link.label}</LinkArrow>
            </div>
          </div>
        </Container>
      </Section>

        </>
      )}

      {/* ---------------------------------------------------------------- Brass: product shot band */}
      <section aria-hidden="true" className="relative h-[46vw] max-h-[720px] min-h-[300px] overflow-hidden bg-night">
        <Image src="/renders/round-side.webp" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,0)_55%,rgba(10,10,11,1)_100%)]" />
      </section>

      {SITE.facilityDetailsPublic && (
      /* ---------------------------------------------------------------- Suites */
      <Section theme="black" id="suites" padding="normal" aria-labelledby="suites-title" className="!pt-4">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4">
              <span className="t-numeral block text-accent" aria-hidden="true">
                0{FACILITY.suites}
              </span>
              <p className="t-label mt-3 text-mist">Private suites</p>
            </div>
            <div className="lg:col-span-8">
              <Head id="suites-title" head={`${FACILITY.lanesPerSuite} lanes each · a host at the door`} headline={SUITES.headline} subhead={SUITES.subhead} />
              <p className="t-body-lg mt-8 max-w-[34em] text-mist">{SUITES.body}</p>
              <dl className="mt-10 grid grid-cols-2 border-t border-hairline-dark sm:grid-cols-4">
                {[
                  { k: "Lanes", v: String(FACILITY.lanesPerSuite) },
                  { k: "Guests", v: String(SUITE?.maxGuestsPerUnit ?? "") },
                  { k: "Minutes", v: String(SUITE?.durationMin ?? "") },
                  ...(PRICES_PUBLIC ? [{ k: "From", v: SUITE ? formatMoney(SUITE.priceCents) : "" }] : []),
                ].map((d) => (
                  <div key={d.k} className="border-b border-hairline-dark py-5 pr-4">
                    <dt className="t-label text-mist">{d.k}</dt>
                    <dd className="t-stencil mt-2 text-[2.5rem] leading-none text-snow">{d.v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-10">
                <Button href={SUITES.cta.href}>{SUITES.cta.label}</Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      )}

      {/* ---------------------------------------------------------------- Training: the two systems in the owner's model */}
      <Section theme="dark" id="training" aria-labelledby="training-title">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <Head id="training-title" className="lg:col-span-7" head={TRAINING_PRELAUNCH.range.eyebrow} headline={TRAINING_PRELAUNCH.range.headline} subhead={TRAINING_PRELAUNCH.room.headline} />
            <p className="t-body-lg text-mist lg:col-span-5">{TRAINING_PRELAUNCH.range.body}</p>
          </div>
          <div className="mt-14 sm:mt-20">
            <RangeTimer labels={TRAINING_PRELAUNCH.range.timer} />
          </div>
          <div className="mt-10">
            <Button href="/training">See training</Button>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- The lounge, as a printed menu */}
      <Section theme="gray" padding="vast" id="hospitality" aria-labelledby="hospitality-title">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-6">
              <Head id="hospitality-title" head={SITE.facilityDetailsPublic ? "The lounge · behind the glass" : "The lounge"} headline={HOSPITALITY.headline} subhead={HOSPITALITY.subhead} />
              <p className="t-body-lg mt-8 max-w-[30em] text-ink-muted">{HOSPITALITY.body}</p>
              <div className="mt-10">
                <LinkArrow href={HOSPITALITY.link.href}>{HOSPITALITY.link.label}</LinkArrow>
              </div>
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <div className="relative mx-auto max-w-[420px] bg-[#f8f4ec] px-6 pb-10 pt-9 sm:px-8 shadow-[0_30px_60px_-30px_rgba(20,18,16,0.45),0_1px_0_rgba(20,18,16,0.06)] lg:rotate-[0.6deg]">
                <p className="text-center font-serif text-[1.9rem] italic leading-none">The Lounge</p>
                <div className="mx-auto my-6 h-px w-16 bg-accent" />
                <ul className="space-y-4">
                  {LOUNGE_MENU.map((m) => (
                    <li key={m.item} className="flex items-baseline gap-3">
                      <span className="t-4 whitespace-nowrap">{m.item}</span>
                      <span aria-hidden="true" className="mb-1 min-w-4 flex-1 border-b border-dotted border-ink/30" />
                      <span className="text-right font-serif text-[1.05rem] italic leading-tight text-ink-muted">{m.note}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-8 border-t border-hairline pt-5 text-center font-serif text-[1.35rem] italic">No alcohol, ever.</p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Membership: spent brass under the headline */}
      <Section theme="black" bleed id="membership" aria-labelledby="membership-title" className="overflow-hidden">
        <div className="relative">
          <div className="relative h-[60vw] max-h-[640px] min-h-[380px]">
            <Image src="/renders/casings.webp" alt="" fill sizes="100vw" className="object-cover" />
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,0.2)_0%,rgba(10,10,11,0)_35%,rgba(10,10,11,0.9)_85%,rgba(10,10,11,1)_100%)]" />
          </div>
          <Container className="relative -mt-40 pb-20 sm:-mt-52 sm:pb-28">
            <Head id="membership-title" head={MEMBERSHIP_PRELAUNCH.hero.eyebrow} headline={MEMBERSHIP_PRELAUNCH.hero.headline} subhead="Tiers, benefits and pricing are announced before opening." />
            <p className="t-body-lg mt-8 max-w-[34em] text-mist">{MEMBERSHIP_PRELAUNCH.hero.body}</p>
            <div className="mt-10">
              <Button href="/membership#apply" variant="accent" size="lg">
                {MEMBERSHIP_PRELAUNCH.hero.cta.label}
              </Button>
            </div>
          </Container>
        </div>
      </Section>

      {SITE.openForBusiness && <UpcomingClasses />}

      {/* ---------------------------------------------------------------- Visit: the headstamp and the address */}
      <Section theme="black" id="visit" aria-labelledby="visit-title" className="overflow-hidden">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Eyebrow>{SITE.address.public ? `${FACILITY.transit.driveFromJfkMin} min from the terminals · ${FACILITY.transit.expressway.split(" (")[0]}` : `${FACILITY.transit.driveFromJfkMin} min from the terminals`}</Eyebrow>
              {SITE.address.public ? (
                <h2 id="visit-title" className="t-display mt-8 text-snow">
                  <span className="t-stencil block text-[1.15em] leading-[0.85] text-accent">{SITE.address.line1.split(" ")[0]}</span>
                  <span className="block whitespace-nowrap text-[0.5em] leading-[1.05]">{SITE.address.line1.split(" ").slice(1).join(" ")}</span>
                </h2>
              ) : (
                <h2 id="visit-title" className="t-display mt-8 text-snow">
                  <span className="block">Queens,</span>
                  <span className="t-accent block">New York.</span>
                </h2>
              )}
              <p className="t-subhead mt-6 max-w-[22em] text-mist">{VISIT.subhead}</p>
              <p className="t-body-lg mt-8 max-w-[32em] text-mist">{VISIT.body}</p>
              <div className="mt-10 flex flex-wrap items-center gap-8">
                <Button href={VISIT.cta.href}>{VISIT.cta.label}</Button>
                {SITE.openForBusiness && <LinkArrow href={VISIT.hoursLink.href}>{VISIT.hoursLink.label}</LinkArrow>}
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="relative mx-auto aspect-square max-w-[480px]">
                <Image src="/renders/headstamp.webp" alt="" fill sizes="(min-width: 1024px) 480px, 90vw" className="object-contain" />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Tonight and live availability: only once the club is open */}
      {SITE.openForBusiness && (
        <>
      <Section theme="light" padding="vast" id="tonight" aria-label="Lanes free tonight">
        <Container>
          <Tonight initial={status} />
        </Container>
      </Section>

      <Section theme="light" padding="tight" id="availability" className="border-t border-hairline" aria-label="Live availability">
        <Container>
          <AvailabilityStrip />
          <div className="mt-8 border-t border-hairline pt-6">
            <LinkArrow href={AVAILABILITY.calendar.href}>{AVAILABILITY.calendar.label}</LinkArrow>
          </div>
        </Container>
      </Section>
        </>
      )}

      <DeskLog />
    </>
  );
}
