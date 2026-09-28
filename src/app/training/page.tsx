import type { Metadata } from "next";
import { DecisionTree } from "@/components/pages/training/Art";
import { InView } from "@/components/pages/training/InView";
import { RangeTimer } from "@/components/fun/RangeTimer";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Render } from "@/components/ui/Render";
import { Section } from "@/components/ui/Section";
import { SIMULATOR, TRAINING_PRELAUNCH as T } from "@/lib/content/pages/training";
import { pageMeta } from "@/lib/seo/meta";

export const metadata: Metadata = pageMeta("/training", { title: T.meta.title, description: T.meta.description });

/**
 * Training before opening, as the owner's model defines it: live fire on the
 * range with a scenario system, laser training in the multipurpose room.
 * The full page with the ladder and course dates is kept in TrainingFull.
 */
export default function TrainingPage() {
  return (
    <>
      <Section theme="black" bleed aria-labelledby="training-title" className="relative flex min-h-[80svh] items-end overflow-hidden">
        <Render name="trio" priority className="opacity-50" position="50% 40%" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(10,10,11,0.96)_0%,rgba(10,10,11,0.65)_50%,rgba(10,10,11,0.2)_100%)]" />
        <Container className="relative pb-16 pt-[calc(var(--nav-h)+4rem)] sm:pb-24">
          <p className="t-eyebrow text-mist">{T.hero.eyebrow}</p>
          <h1 id="training-title" className="t-hero mt-6 max-w-[13em] text-snow">
            {T.hero.headline}
          </h1>
          <p className="t-body-lg mt-8 max-w-[34em] text-mist">{T.hero.body}</p>
        </Container>
      </Section>

      <Section theme="dark" id="range" aria-labelledby="range-title">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Eyebrow className="mb-6">{T.range.eyebrow}</Eyebrow>
              <h2 id="range-title" className="t-1 text-snow">
                {T.range.headline}
              </h2>
            </div>
            <p className="t-body-lg text-mist lg:col-span-5">{T.range.body}</p>
          </div>
          <div className="mt-14 sm:mt-20">
            <RangeTimer labels={T.range.timer} />
          </div>
        </Container>
      </Section>

      <Section theme="light" id="training-room" aria-labelledby="room-title">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
            <div className="lg:col-span-5">
              <Eyebrow className="mb-6">{T.room.eyebrow}</Eyebrow>
              <h2 id="room-title" className="t-1">
                {T.room.headline}
              </h2>
              <p className="t-body-lg mt-6 text-ink-muted">{T.room.body}</p>
            </div>
            <div className="lg:col-span-7">
              <InView as="figure" className="m-0 aspect-[16/9] w-full overflow-hidden rounded-card ring-1 ring-ink/10">
                <DecisionTree root={SIMULATOR.tree.root} branches={SIMULATOR.tree.branches} leaves={SIMULATOR.tree.leaves} goldLeaf={SIMULATOR.tree.goldLeaf} />
              </InView>
            </div>
          </div>
        </Container>
      </Section>

      <Section theme="black" id="instruction" aria-labelledby="instruction-title">
        <Container>
          <Eyebrow className="mb-6">{T.instruction.eyebrow}</Eyebrow>
          <h2 id="instruction-title" className="t-1 max-w-[15em] text-snow">
            {T.instruction.headline}
          </h2>
          <p className="t-body-lg mt-6 max-w-[34em] text-mist">{T.instruction.body}</p>
          <div className="mt-10">
            <Button href={T.instruction.cta.href} variant="accent" size="lg">
              {T.instruction.cta.label}
            </Button>
          </div>
        </Container>
      </Section>

      <Section theme="light" id="license" aria-labelledby="license-title">
        <Container>
          <Eyebrow className="mb-6">{T.license.eyebrow}</Eyebrow>
          <h2 id="license-title" className="t-1">
            {T.license.headline}
          </h2>
          <p className="t-body-lg mt-6 max-w-[34em] text-ink-muted">{T.license.body}</p>
          <ol className="mt-12 grid border-t border-ink sm:grid-cols-4">
            {T.license.steps.map((s, i) => (
              <li key={s.title} className="border-b border-hairline py-8 pr-6 sm:border-b-0 sm:pl-6 sm:first:pl-0 sm:[&+li]:border-l">
                <span className="t-stencil block text-[3rem] leading-none text-accent-deep">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="t-3 mt-4">{s.title}</h3>
                <p className="t-body mt-2 text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>
    </>
  );
}
