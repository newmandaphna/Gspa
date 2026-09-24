import type { Metadata } from "next";
import { GlassPanel, Glow } from "@/components/art";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { Item, Reveal, Stagger } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { DecisionTree, GroupingTarget, Ladder, MonthGrid, PairDiagram, ProcessLine, SeatDots, StepRail } from "@/components/pages/training/Art";
import { InView } from "@/components/pages/training/InView";
import { cn } from "@/lib/cn";
import { COURSES, FIRST_SESSION, HERO, LADDER, LICENSE, PRIVATE, SIMULATOR, TRAINING_META } from "@/lib/content/pages/training";

export const metadata: Metadata = {
  title: TRAINING_META.title,
  description: TRAINING_META.description,
};

/* Page-local helpers. Gold small text on light must be accent-deep for contrast. */

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

function Headline({
  kicker,
  headline,
  subhead,
  body,
  tone,
  center = false,
  as: Tag = "h2",
  className,
}: {
  kicker: string;
  headline: string;
  subhead: string;
  body?: string;
  tone: "light" | "dark";
  center?: boolean;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <Reveal className={cn(center ? "mx-auto text-center" : "", "max-w-[720px]", className)}>
      <Kicker tone={tone}>{kicker}</Kicker>
      <Tag className={cn(Tag === "h1" ? "t-hero" : "t-1", "mt-3")}>{headline}</Tag>
      <p className={cn("t-lead mt-2", tone === "dark" ? "text-mist" : "text-ink-muted")}>{subhead}</p>
      {body && <p className={cn("t-body-lg mt-6 max-w-[40em]", center && "mx-auto", tone === "dark" ? "text-mist" : "text-ink-muted")}>{body}</p>}
    </Reveal>
  );
}

export default function TrainingPage() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <Section theme="black" id="hero" className="grain overflow-hidden pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
        <Glow className="-top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2" />
        <Container className="relative">
          <Headline as="h1" kicker={HERO.eyebrow} headline={HERO.headline} subhead={HERO.subhead} body={HERO.body} tone="dark" center />
          <Reveal delay={0.15} className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Button href={HERO.cta.href} size="lg">
              {HERO.cta.label}
            </Button>
            <LinkArrow href={HERO.link.href}>{HERO.link.label}</LinkArrow>
          </Reveal>
          <Reveal delay={0.25} className="mt-14 sm:mt-20">
            <ImageSlot slot={HERO.imageSlot} alt={HERO.imageAlt} className="aspect-[16/9] rounded-card ring-1 ring-white/10" art={<GroupingTarget />} priority />
          </Reveal>
        </Container>
      </Section>

      {/* -------------------------------------------------------------- Ladder */}
      <Section theme="light" id="ladder">
        <Container>
          <Headline kicker={LADDER.eyebrow} headline={LADDER.headline} subhead={LADDER.subhead} body={LADDER.body} tone="light" />
          <Reveal delay={0.1} className="mt-12 sm:mt-16">
            <Ladder rungs={LADDER.rungs} />
          </Reveal>
          <Reveal delay={0.15} className="mt-8">
            <LinkArrow href={LADDER.requirements.href}>{LADDER.requirements.label}</LinkArrow>
          </Reveal>
        </Container>
      </Section>

      {/* ------------------------------------------------------- First Session */}
      <Section theme="dark" id="first-session" className="overflow-hidden">
        <Glow className="-right-40 top-1/3 h-[480px] w-[480px]" />
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-6">
              <Headline kicker={FIRST_SESSION.eyebrow} headline={FIRST_SESSION.headline} subhead={FIRST_SESSION.subhead} body={FIRST_SESSION.body} tone="dark" />
              <Reveal delay={0.1} className="mt-10">
                <InView>
                  <StepRail steps={FIRST_SESSION.steps} />
                </InView>
              </Reveal>
              <Reveal delay={0.15} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Button href={FIRST_SESSION.cta.href}>{FIRST_SESSION.cta.label}</Button>
                <LinkArrow href={FIRST_SESSION.requirements.href}>{FIRST_SESSION.requirements.label}</LinkArrow>
              </Reveal>
            </div>
            <Reveal delay={0.2} className="lg:col-span-5 lg:col-start-8">
              <GlassPanel className="p-7 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="t-4">{FIRST_SESSION.card.name}</p>
                    <p className="mt-1 font-mono text-[0.8125rem] text-mist">{FIRST_SESSION.card.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="t-3 tabular">{FIRST_SESSION.card.price}</p>
                    <p className="t-footnote text-mist">{FIRST_SESSION.card.priceNote}</p>
                  </div>
                </div>
                <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
                  {FIRST_SESSION.card.includes.map((line) => (
                    <li key={line} className="t-caption py-2.5 text-snow/90">
                      {line}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Badge tone="dark">{FIRST_SESSION.card.eligibility}</Badge>
                  {FIRST_SESSION.card.secondStudent && (
                    <span className="tabular font-mono text-[0.8125rem] text-mist">{FIRST_SESSION.card.secondStudent}</span>
                  )}
                </div>
              </GlassPanel>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------- Private */}
      <Section theme="light" id="private">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-6">
              <Headline kicker={PRIVATE.eyebrow} headline={PRIVATE.headline} subhead={PRIVATE.subhead} body={PRIVATE.body} tone="light" />
              <Reveal delay={0.1} className="mt-6 flex flex-wrap items-center gap-3">
                <Badge tone="light">{PRIVATE.eligibility}</Badge>
                {PRIVATE.price && <span className="tabular font-mono text-[0.8125rem] text-ink-muted">{PRIVATE.price}</span>}
              </Reveal>
              <Reveal delay={0.15} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Button href={PRIVATE.cta.href}>{PRIVATE.cta.label}</Button>
                <LinkArrow href={PRIVATE.requirements.href}>{PRIVATE.requirements.label}</LinkArrow>
              </Reveal>
            </div>
            <Reveal delay={0.2} className="lg:col-span-6">
              <InView as="figure" className="aspect-[16/9] w-full overflow-hidden rounded-card ring-1 ring-ink/10">
                <PairDiagram left={PRIVATE.diagram.left} right={PRIVATE.diagram.right} />
              </InView>
            </Reveal>
          </div>

          <Reveal className="mt-20 sm:mt-24">
            <h3 className="t-3">{PRIVATE.instructorsHeadline}</h3>
          </Reveal>
          <Stagger className="mt-8 grid gap-8 sm:grid-cols-3">
            {PRIVATE.instructors.map((p) => (
              <Item key={p.slot}>
                <div className="flex items-center gap-4 sm:flex-col sm:items-start">
                  <ImageSlot
                    slot={p.slot}
                    alt={p.alt}
                    className="h-24 w-24 shrink-0 rounded-full bg-paper-2 ring-1 ring-hairline"
                    sizes="96px"
                    art={
                      <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
                        <circle cx="48" cy="38" r="15" fill="none" stroke="#d2d2d7" strokeWidth="1" />
                        <path d="M20 84c4-16 14-24 28-24s24 8 28 24" fill="none" stroke="#d2d2d7" strokeWidth="1" />
                      </svg>
                    }
                  />
                  <div>
                    <p className="t-4">{p.name}</p>
                    <p className="t-caption mt-1 text-ink-muted">{p.credential}</p>
                  </div>
                </div>
              </Item>
            ))}
          </Stagger>
        </Container>
      </Section>

      {/* ------------------------------------------------------------- Courses */}
      <Section theme="black" id="courses" className="grain overflow-hidden">
        <Glow className="-left-40 top-1/2 h-[520px] w-[520px] -translate-y-1/2" />
        <Container className="relative">
          <Headline kicker={COURSES.eyebrow} headline={COURSES.headline} subhead={COURSES.subhead} body={COURSES.body} tone="dark" />
          <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-10">
            <Reveal delay={0.1} className="lg:col-span-6">
              <InView as="figure" className="rounded-card bg-night-2 p-4 ring-1 ring-white/10 sm:p-6">
                <MonthGrid ringed={COURSES.ringedDays} />
                <figcaption className="mt-3 font-mono text-[0.75rem] text-mist">{COURSES.calendarCaption}</figcaption>
              </InView>
            </Reveal>
            <div className="lg:col-span-5 lg:col-start-8">
              <Reveal delay={0.15}>
                <p className="t-numeral tabular text-snow">{COURSES.numeral}</p>
                <p className="t-eyebrow mt-3 text-accent">{COURSES.numeralCaption}</p>
              </Reveal>
              <Reveal delay={0.2} className="mt-10">
                <InView>
                  <SeatDots count={COURSES.seats} />
                </InView>
                <p className="mt-3 font-mono text-[0.75rem] text-mist">{COURSES.seatsCaption}</p>
              </Reveal>
              <Reveal delay={0.25} className="mt-8 space-y-2">
                {COURSES.priceLine && <p className="tabular font-mono text-[0.8125rem] text-mist">{COURSES.priceLine}</p>}
                <p className="font-mono text-[0.8125rem] text-mist">{COURSES.note}</p>
              </Reveal>
              <Reveal delay={0.3} className="mt-6 flex flex-wrap items-center gap-3">
                <Badge tone="dark">{COURSES.eligibility}</Badge>
                <span className="inline-flex items-center rounded-pill px-2.5 py-1 font-mono text-[0.6875rem] text-mist ring-1 ring-inset ring-white/15">Inquire</span>
              </Reveal>
              <Reveal delay={0.35} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Button href={COURSES.cta.href}>{COURSES.cta.label}</Button>
                <LinkArrow href={COURSES.requirements.href}>{COURSES.requirements.label}</LinkArrow>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* ----------------------------------------------------------- Simulator */}
      <Section theme="light" id="simulator">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <Reveal className="order-2 lg:order-1 lg:col-span-7">
              <InView as="figure" className="aspect-[16/9] w-full overflow-hidden rounded-card ring-1 ring-ink/10">
                <DecisionTree root={SIMULATOR.tree.root} branches={SIMULATOR.tree.branches} leaves={SIMULATOR.tree.leaves} goldLeaf={SIMULATOR.tree.goldLeaf} />
              </InView>
            </Reveal>
            <div className="order-1 lg:order-2 lg:col-span-5">
              <Headline kicker={SIMULATOR.eyebrow} headline={SIMULATOR.headline} subhead={SIMULATOR.subhead} body={SIMULATOR.body} tone="light" />
              <Reveal delay={0.1} className="mt-6 flex flex-wrap items-center gap-3">
                <Badge tone="light">{SIMULATOR.eligibility}</Badge>
                {SIMULATOR.price && <span className="tabular font-mono text-[0.8125rem] text-ink-muted">{SIMULATOR.price}</span>}
              </Reveal>
              <Reveal delay={0.15} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Button href={SIMULATOR.cta.href}>{SIMULATOR.cta.label}</Button>
                <LinkArrow href={SIMULATOR.link.href}>{SIMULATOR.link.label}</LinkArrow>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------- License */}
      <Section theme="black" id="license" className="grain overflow-hidden">
        <Glow className="-top-40 right-0 h-[480px] w-[720px]" variant="white" />
        <Container className="relative">
          <Headline kicker={LICENSE.eyebrow} headline={LICENSE.headline} subhead={LICENSE.subhead} body={LICENSE.body} tone="dark" />
          <Reveal delay={0.1} className="mt-14 sm:mt-16">
            <InView>
              <ProcessLine nodes={LICENSE.nodes} className="mx-auto max-w-[860px]" />
            </InView>
            <p className="mt-10 text-center font-mono text-[0.8125rem] text-mist">{LICENSE.note}</p>
          </Reveal>
          <Reveal delay={0.15} className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Button href={LICENSE.cta.href}>{LICENSE.cta.label}</Button>
            <LinkArrow href={LICENSE.requirements.href}>{LICENSE.requirements.label}</LinkArrow>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
