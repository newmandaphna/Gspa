import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/JsonLd";
import { courseJsonLd } from "@/lib/seo/jsonld";
import { GlassPanel } from "@/components/art";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Headline } from "@/components/ui/Headline";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { Row, Rows } from "@/components/ui/List";
import { PullQuote } from "@/components/ui/PullQuote";
import { Section } from "@/components/ui/Section";
import { DecisionTree, GroupingTarget, Ladder, MonthGrid, PortraitArt, ProcessLine, SeatDots, StepRail } from "@/components/pages/training/Art";
import { InView } from "@/components/pages/training/InView";
import { FACILITY } from "@/lib/config/site";
import { COURSES, FIRST_SESSION, HERO, LADDER, LICENSE, PRIVATE, SIMULATOR, TRAINING_META, UPCOMING_CLASSES } from "@/lib/content/pages/training";

export const metadata: Metadata = pageMeta("/training", {
  title: TRAINING_META.title,
  description: TRAINING_META.description,
});

/** The house line that stands in the hero until an instructor's own words arrive. Never attributed to a name. */
const HOUSE_LINE = "Nobody skips a step.";

export default function TrainingPage() {
  const lead = PRIVATE.instructors[0];
  return (
    <>
      <JsonLd data={courseJsonLd()} />
      {/* ------------------------------------------------------------ Hero */}
      <Section theme="black" id="hero" className="grain overflow-hidden pt-[calc(var(--nav-h)+2.5rem)] sm:pt-[calc(var(--nav-h)+3.5rem)]">
        <Container className="relative">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-10">
            {/* The portrait fills the left five columns at 4:5; the photo drops in at the same crop. */}
            <figure className="m-0 lg:col-span-5">
              <ImageSlot slot={lead.slot} alt={lead.alt} className="aspect-[4/5] rounded-card ring-1 ring-white/10" art={<PortraitArt />} sizes="(min-width: 1024px) 480px, 100vw" priority />
              <figcaption className="t-caption mt-3 text-mist">{PRIVATE.instructorsHeadline}</figcaption>
            </figure>
            <div className="lg:col-span-6 lg:col-start-7 lg:pb-10">
              <Headline
                as="h1"
                size="2"
                head={`${FACILITY.instructors} instructors · classroom for ${FACILITY.classroomSeats}`}
                headline={HERO.headline}
                subhead={HERO.subhead}
              />
              {/* The quote position: t-1 on the right, reserved for an instructor's own line. */}
              <blockquote className="m-0 mt-10">
                <p className="t-1 t-italic max-w-[12em]">{HOUSE_LINE}</p>
              </blockquote>
              <div className="mt-10">
                <Button href={HERO.cta.href} size="lg">
                  {HERO.cta.label}
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------- Ladder */}
      <Section theme="light" id="ladder">
        <Container>
          <Headline layout="beside" head={`${LADDER.rungs.length} rungs · the first needs only photo ID`} headline={LADDER.headline} subhead={LADDER.subhead} body={LADDER.body} />
          <Ladder rungs={LADDER.rungs} className="mt-12 sm:mt-16" />
        </Container>
      </Section>

      {/* --------------------------------------------------- First Session */}
      <Section theme="dark" id="first-session" className="overflow-hidden">
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-6">
              <Headline head={[FIRST_SESSION.card.price, FIRST_SESSION.card.duration, FIRST_SESSION.card.secondStudent].filter(Boolean).join(" · ")} headline={FIRST_SESSION.headline} subhead={FIRST_SESSION.subhead} body={FIRST_SESSION.body}>
                <LinkArrow href={FIRST_SESSION.cta.href} className="mt-6">
                  {FIRST_SESSION.cta.label}
                </LinkArrow>
              </Headline>
              <InView className="mt-12">
                <StepRail steps={FIRST_SESSION.steps} />
              </InView>
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <GlassPanel className="p-7 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="t-4">{FIRST_SESSION.card.name}</p>
                    <p className="mt-1 font-mono text-[0.8125rem] text-mist">{FIRST_SESSION.card.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="t-3 t-price">{FIRST_SESSION.card.price}</p>
                    <p className="t-footnote text-mist">{FIRST_SESSION.card.priceNote}</p>
                  </div>
                </div>
                <Rows mark="check" size="sm" className="mt-6">
                  {FIRST_SESSION.card.includes.map((line) => (
                    <Row key={line}>{line}</Row>
                  ))}
                </Rows>
                <p className="mt-6 font-mono text-[0.8125rem] leading-[1.6] text-mist">{FIRST_SESSION.card.eligibility}.</p>
              </GlassPanel>
            </div>
          </div>
        </Container>
      </Section>

      {/* --------------------------------------------------------- Private */}
      <Section theme="light" id="private">
        <Container>
          <Headline layout="beside" head={PRIVATE.price} headline={PRIVATE.headline} subhead={PRIVATE.subhead} body={PRIVATE.body}>
            <p className="mt-4 font-mono text-[0.8125rem] leading-[1.6] text-ink-muted">
              {PRIVATE.eligibility}.{PRIVATE.secondStudent && <> {PRIVATE.secondStudent}.</>}
            </p>
            <LinkArrow href={PRIVATE.cta.href} className="mt-6">
              {PRIVATE.cta.label}
            </LinkArrow>
          </Headline>
          <figure className="m-0 mt-14 sm:mt-20">
            <ImageSlot slot={HERO.imageSlot} alt={HERO.imageAlt} className="aspect-[16/9] rounded-card ring-1 ring-ink/10" art={<GroupingTarget />} sizes="(min-width: 1180px) 1180px, 100vw" />
          </figure>
          {/* The instructors, one row each, with a 4:5 slot for the portrait sitting. */}
          <h3 className="t-3 mt-14 sm:mt-20">{PRIVATE.instructorsHeadline}</h3>
          <ul className="mt-6 border-t border-hairline" aria-label="Instructors">
            {PRIVATE.instructors.map((p) => (
              <li key={p.slot} className="flex items-center gap-5 border-b border-hairline py-4">
                <ImageSlot slot={p.slot} alt={p.alt} className="h-20 w-16 shrink-0 rounded-card-sm ring-1 ring-hairline" sizes="64px" art={<PortraitArt />} />
                <div className="min-w-0">
                  <p className="t-4">{p.name}</p>
                  <p className="mt-1 font-mono text-[0.8125rem] text-ink-muted">{p.credential}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* --------------------------------------------------------- Courses */}
      <Section theme="black" id="courses" className="grain overflow-hidden">
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <Headline
                head={`${COURSES.seatsCaption} · ${COURSES.calendarCaption} · new dates post monthly`}
                headline={COURSES.headline}
                subhead={COURSES.subhead}
                body={COURSES.body}
              />
              <div className="mt-8 space-y-2 font-mono text-[0.8125rem] leading-[1.6] text-mist">
                {COURSES.priceLine && <p>{COURSES.priceLine}</p>}
                <p>{COURSES.note}</p>
                <p>{COURSES.eligibility}. Ask the desk for dates.</p>
              </div>
              <div className="mt-8">
                <Button href={COURSES.cta.href}>{COURSES.cta.label}</Button>
                <LinkArrow href={UPCOMING_CLASSES.link.href} className="ml-5">
                  {UPCOMING_CLASSES.link.label}
                </LinkArrow>
              </div>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <InView as="figure" className="m-0 rounded-card bg-night-2 p-4 ring-1 ring-white/10 sm:p-6">
                <MonthGrid ringed={COURSES.ringedDays} />
                <figcaption className="mt-3 font-mono text-[0.75rem] text-mist">{COURSES.calendarCaption}</figcaption>
              </InView>
              <InView className="mt-8">
                <SeatDots count={COURSES.seats} />
                <p className="mt-3 font-mono text-[0.75rem] text-mist">{COURSES.seatsCaption}</p>
              </InView>
            </div>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------ Silent: one line */}
      <Section theme="black" padding="vast" aria-label="House line">
        <Container>
          <PullQuote>{LICENSE.note}</PullQuote>
        </Container>
      </Section>

      {/* ------------------------------------------------------- Simulator */}
      <Section theme="light" padding="tight" id="simulator">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
            <div className="order-2 lg:order-1 lg:col-span-7">
              <InView as="figure" className="m-0 aspect-[16/9] w-full overflow-hidden rounded-card ring-1 ring-ink/10">
                <DecisionTree root={SIMULATOR.tree.root} branches={SIMULATOR.tree.branches} leaves={SIMULATOR.tree.leaves} goldLeaf={SIMULATOR.tree.goldLeaf} />
              </InView>
            </div>
            <div className="order-1 lg:order-2 lg:col-span-5">
              <Headline head={SIMULATOR.price} headline={SIMULATOR.headline} subhead={SIMULATOR.subhead} body={SIMULATOR.body}>
                <p className="mt-4 font-mono text-[0.8125rem] leading-[1.6] text-ink-muted">{SIMULATOR.eligibility}.</p>
                <div className="mt-8">
                  <Button href={SIMULATOR.cta.href}>{SIMULATOR.cta.label}</Button>
                </div>
              </Headline>
            </div>
          </div>
        </Container>
      </Section>

      {/* --------------------------------------------------------- License */}
      <Section theme="dark" id="license" className="overflow-hidden">
        <Container className="relative">
          <Headline layout="beside" head={`${LICENSE.nodes.length} steps · ${LICENSE.nodes.filter((n) => "here" in n && n.here).length} of them here`} headline={LICENSE.headline} subhead={LICENSE.subhead} body={LICENSE.body}>
            <LinkArrow href={LICENSE.cta.href} className="mt-6">
              {LICENSE.cta.label}
            </LinkArrow>
          </Headline>
          <InView className="mt-14 sm:mt-20">
            <ProcessLine nodes={LICENSE.nodes} className="mx-auto max-w-[860px]" />
          </InView>
        </Container>
      </Section>
    </>
  );
}
