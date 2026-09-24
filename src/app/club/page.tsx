import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import Link from "next/link";
import { AirFlow, LockerGrid, LoungePhotoArt, Scanline, ServiceTools, SuitePhotoArt } from "@/components/pages/club/Art";
import { InView } from "@/components/pages/club/InView";
import { TargetRail } from "@/components/pages/club/TargetRail";
import { ZoneWatch } from "@/components/pages/club/ZoneWatch";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Headline } from "@/components/ui/Headline";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { Row, Rows, Specs, type Spec } from "@/components/ui/List";
import { PullQuote } from "@/components/ui/PullQuote";
import { Section } from "@/components/ui/Section";
import { ELIGIBILITY_LABELS } from "@/lib/content/catalog";
import {
  CLUB_AIR,
  CLUB_AVAILABILITY_CTA,
  CLUB_HERO,
  CLUB_LOCKERS,
  CLUB_LOUNGE,
  CLUB_META,
  CLUB_DECISIONS,
  CLUB_SIMULATOR,
  DECISIONS,
  CLUB_SUITES,
  CLUB_TARGETS,
  DETAILING,
  GUNSMITH,
  LOCKER_NOTE,
  LOUNGE_CAPTION,
  LOUNGE_FEATURES,
  LOUNGE_PHOTO_ALT,
  PRIVATE_SUITE,
  SERVICES_CAPTION,
  SIMULATOR,
  SUITE_PHOTO_ALT,
  TARGET_STOPS,
  numberWord,
  type ZoneKey,
} from "@/lib/content/pages/club";
import { FACILITY, LOCKERS_TOTAL } from "@/lib/config/site";
import { HOUSE_RULES } from "@/lib/content/requirements";
import { formatMoney } from "@/lib/time";

/** Suite facts as label / value pairs, read from the catalog item and FACILITY (the same sources as SUITE_SPECS). */
const SUITE_FACTS: ReadonlyArray<Spec> = [
  { label: "Lanes", value: numberWord(FACILITY.lanesPerSuite).replace(/^\w/, (c) => c.toUpperCase()) },
  { label: "Guests", value: `Up to ${numberWord(PRIVATE_SUITE.maxGuestsPerUnit)}` },
  { label: "Range officer", value: "Dedicated" },
  { label: "Duration", value: `${PRIVATE_SUITE.durationMin} minutes` },
];

export const metadata: Metadata = pageMeta("/club", {
  title: CLUB_META.title,
  description: CLUB_META.description,
});

/* ------------------------------------------------------------ helpers */

/** One block on the right of the pinned plan. data-zone tells the plan which zone to light. */
function Zone({ zone, id, children }: { zone: ZoneKey; id: string; children: React.ReactNode }) {
  return (
    <section data-zone={zone} id={id} className="scroll-mt-[calc(var(--nav-h)+2rem)] border-t border-white/10 pt-14 first:border-t-0 first:pt-0 lg:min-h-[50vh]">
      {children}
    </section>
  );
}

const stops = TARGET_STOPS.slice(0, -1).join(", ");

/* --------------------------------------------------------------- page */

export default function ClubPage() {
  return (
    <>
      {/* The plan is the hero: pinned on the left at lg while the rooms scroll past on the right. */}
      <Section theme="black" padding="tight" className="pt-[calc(var(--nav-h)+2.5rem)] sm:pt-[calc(var(--nav-h)+3.5rem)]">
        <Container>
          <ZoneWatch
            caption={
              <>
                <h1 className="t-2 max-w-[14em]">{CLUB_HERO.headline}</h1>
                <p className="t-subhead mt-3 max-w-[26em] text-mist">{CLUB_HERO.subhead}</p>
                <div className="mt-8">
                  <Button href={CLUB_AVAILABILITY_CTA.href}>{CLUB_AVAILABILITY_CTA.label}</Button>
                </div>
              </>
            }
          >
            <div className="space-y-14 sm:space-y-20">
              {/* Air */}
              <Zone zone="lanes" id="air">
                <Headline head={CLUB_AIR.eyebrow} headline={CLUB_AIR.headline} subhead={CLUB_AIR.subhead} body={CLUB_AIR.body}>
                  {CLUB_AIR.secondary && (
                    <LinkArrow href={CLUB_AIR.secondary.href} className="mt-6">
                      {CLUB_AIR.secondary.label}
                    </LinkArrow>
                  )}
                </Headline>
                <InView className="mt-12">
                  <AirFlow tone="dark" />
                </InView>
              </Zone>

              {/* Targets */}
              <Zone zone="lanes" id="targets">
                <Headline head={`Carriers stop at ${stops} and ${FACILITY.laneYards} yd`} headline={CLUB_TARGETS.headline} subhead={CLUB_TARGETS.subhead} body={CLUB_TARGETS.body} />
                <TargetRail stops={TARGET_STOPS} className="mt-10" />
              </Zone>

              {/* Suites */}
              <Zone zone="suites" id="suites">
                <Headline
                  head={`${FACILITY.suites} suites · ${PRIVATE_SUITE.durationMin} minutes · from ${formatMoney(PRIVATE_SUITE.priceCents)}`}
                  headline={CLUB_SUITES.headline}
                  subhead={CLUB_SUITES.subhead}
                  body={CLUB_SUITES.body}
                />
                <ImageSlot slot="SUITE_PHOTO_02" alt={SUITE_PHOTO_ALT} className="mt-10 aspect-[16/9] rounded-card ring-1 ring-white/10" art={<SuitePhotoArt />} sizes="(min-width: 1024px) 560px, 100vw" />
                <Specs className="mt-8" aria-label={`${PRIVATE_SUITE.name} at a glance`} items={SUITE_FACTS} />
                <p className="mt-5 font-mono text-[0.8125rem] leading-[1.6] text-mist">
                  From {formatMoney(PRIVATE_SUITE.priceCents)} for the suite
                  {PRIVATE_SUITE.memberPriceCents !== undefined && <>, members {formatMoney(PRIVATE_SUITE.memberPriceCents)}</>}. {ELIGIBILITY_LABELS[PRIVATE_SUITE.eligibility]}.
                </p>
                {CLUB_SUITES.cta && (
                  <div className="mt-8">
                    <Button href={CLUB_SUITES.cta.href}>{CLUB_SUITES.cta.label}</Button>
                  </div>
                )}
              </Zone>

              {/* Simulator */}
              <Zone zone="sim" id="simulator">
                <Headline
                  head={`${formatMoney(SIMULATOR.priceCents)} · ${SIMULATOR.durationMin} minutes · up to ${SIMULATOR.maxGuestsPerUnit} to a bay`}
                  headline={CLUB_SIMULATOR.headline}
                  subhead={CLUB_SIMULATOR.subhead}
                  body={CLUB_SIMULATOR.body}
                />
                <Scanline className="mt-10 aspect-[4/3]" label="Bay 01" />
                <p className="mt-5 font-mono text-[0.8125rem] leading-[1.6] text-mist">{ELIGIBILITY_LABELS[SIMULATOR.eligibility]}.</p>
                {CLUB_SIMULATOR.cta && (
                  <div className="mt-8">
                    <Button href={CLUB_SIMULATOR.cta.href}>{CLUB_SIMULATOR.cta.label}</Button>
                  </div>
                )}
              </Zone>

              {/* Lounge */}
              <Zone zone="lounge" id="lounge">
                <Headline head="The line through glass · espresso on this side" headline={CLUB_LOUNGE.headline} subhead={CLUB_LOUNGE.subhead} body={CLUB_LOUNGE.body} />
                <figure className="m-0 mt-10">
                  <ImageSlot slot="LOUNGE_PHOTO_02" alt={LOUNGE_PHOTO_ALT} className="aspect-[4/3] rounded-card ring-1 ring-white/10" art={<LoungePhotoArt />} sizes="(min-width: 1024px) 560px, 100vw" />
                  <figcaption className="t-caption mt-3 text-mist">{LOUNGE_CAPTION}</figcaption>
                </figure>
                <Rows size="sm" className="mt-8" aria-label="In the lounge">
                  {LOUNGE_FEATURES.map((f) => (
                    <Row key={f.icon}>{f.label}</Row>
                  ))}
                </Rows>
              </Zone>

              {/* Lockers and detailing */}
              <Zone zone="lockers" id="lockers">
                <Headline head={`${LOCKERS_TOTAL} lockers · fingerprint or PIN · gear only`} headline={CLUB_LOCKERS.headline} subhead={CLUB_LOCKERS.subhead} body={CLUB_LOCKERS.body} />
                <div className="mt-10 rounded-card bg-night p-4 ring-1 ring-white/10 sm:p-6">
                  <LockerGrid />
                </div>
                <p className="mt-4 font-mono text-[0.8125rem] leading-[1.6] text-mist">
                  {LOCKER_NOTE.text}{" "}
                  <Link href={LOCKER_NOTE.link.href} className="underline underline-offset-4 hover:text-snow">
                    {LOCKER_NOTE.link.label}
                  </Link>
                  .
                </p>
                <div className="mt-10 rounded-card bg-night p-4 ring-1 ring-white/10 sm:p-6">
                  <ServiceTools />
                </div>
                <p className="mt-3 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-mist">{SERVICES_CAPTION}</p>
                <Rows className="mt-6" aria-label="Members' services">
                  {[GUNSMITH, DETAILING].map((s) => (
                    <Row key={s.slug}>
                      <span className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                        <span className="t-4">{s.name}</span>
                        <span className="t-caption text-mist sm:text-right">{s.tagline}</span>
                      </span>
                    </Row>
                  ))}
                </Rows>
                {CLUB_LOCKERS.cta && (
                  <LinkArrow href={CLUB_LOCKERS.cta.href} className="mt-6">
                    {CLUB_LOCKERS.cta.label}
                  </LinkArrow>
                )}
              </Zone>
            </div>
          </ZoneWatch>
        </Container>
      </Section>

      {/* Silent: one line, nothing else. The same black as the band above, so the alternation breaks here. */}
      <Section theme="black" padding="vast" aria-label="House line">
        <Container>
          <PullQuote>No alcohol, ever.</PullQuote>
        </Container>
      </Section>

      {/* Things we decided: the page ends on the rules. */}
      <Section theme="light" id="decisions">
        <Container>
          <Headline
            layout="beside"
            head={`${numberWord(DECISIONS.length)} calls made before the doors opened · ${numberWord(HOUSE_RULES.length)} house rules on their own page`}
            headline={CLUB_DECISIONS.headline}
            subhead={CLUB_DECISIONS.subhead}
            body={CLUB_DECISIONS.body}
          >
            {CLUB_DECISIONS.cta && (
              <LinkArrow href={CLUB_DECISIONS.cta.href} className="mt-6">
                {CLUB_DECISIONS.cta.label}
              </LinkArrow>
            )}
          </Headline>
          <ol className="m-0 mt-14 list-none border-t border-hairline p-0 sm:mt-20 lg:ml-[41.667%] lg:pl-5">
            {DECISIONS.map((d, i) => (
              <li key={d.decision} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline border-b border-hairline py-6 sm:py-7">
                <span className="tabular font-mono text-[0.8125rem] text-ink-faint" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="t-3 max-w-[18em]">
                    <span className="sr-only">Decision {i + 1}. </span>
                    {d.decision}
                  </p>
                  <p className="t-body mt-2 max-w-[34em] text-ink-muted">{d.reason}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>
    </>
  );
}
