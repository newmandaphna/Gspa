import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { LegalNav } from "@/components/pages/legal/LegalNav";
import { RetentionTable } from "@/components/pages/legal/RetentionTable";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { Numbered, NumberedItem, Row, Rows } from "@/components/ui/List";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";
import {
  ACKNOWLEDGEMENT,
  BACK_TO_RESERVE,
  LEGAL_HERO,
  LEGAL_META,
  LEGAL_NAV,
  LEGAL_UPDATED,
  LONG_FORM_SECTIONS,
  NAV_LABEL,
  RANGE_RULES_COPY,
  RETENTION_ROWS,
  SCREENING_BY,
  SEE_REQUIREMENTS,
  TAG_LABELS,
  type LegalSection,
} from "@/lib/content/pages/legal";
import { RANGE_RULES, REQUIREMENTS, REQUIREMENTS_LAST_REVIEWED } from "@/lib/content/requirements";

export const metadata: Metadata = pageMeta("/legal", {
  title: LEGAL_META.title,
  description: LEGAL_META.description,
});

/* ------------------------------------------------------------ helpers */

const ANCHOR = "scroll-mt-[calc(var(--nav-h)+1.5rem)]";
const MEASURE = "max-w-[34em]";

/** Mono "Last updated [date]" stamp. Inherits the band's muted color. */
function Stamp({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mt-4 font-mono text-[0.8125rem] leading-[1.5] text-ink-muted [[data-theme=dark]_&]:text-mist", className)}>{children}</p>;
}

/** Bracketed counsel note, rendered verbatim. */
function CounselNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-8 font-mono text-[0.8125rem] leading-[1.5] text-ink-muted [[data-theme=dark]_&]:text-mist">{children}</p>;
}

/** One long-form section: headline block, stamp, clauses with hairlines. */
function LongForm({ section }: { section: LegalSection }) {
  const headingId = `${section.id}-heading`;
  return (
    <section id={section.id} aria-labelledby={headingId} className={cn(ANCHOR, "border-t border-hairline pt-12 pb-16 sm:pt-14 sm:pb-20 first:border-t-0 first:pt-0")}>
      <Reveal className={MEASURE}>
        <Eyebrow className="mb-3">{section.label}</Eyebrow>
        <h2 id={headingId} className="t-2">
          {section.headline}
        </h2>
        <p className="t-lead mt-2 text-ink-muted">{section.subhead}</p>
        <Stamp>Last updated {section.updated}</Stamp>
        {section.id === "screening" && <Stamp className="mt-1">{SCREENING_BY}</Stamp>}
      </Reveal>

      <div className={cn(MEASURE, "mt-10")}>
        {section.clauses.map((c, i) => (
          <div key={c.heading} className={cn("border-t border-hairline py-7", i === 0 && "border-t-0 pt-0")}>
            <h3 className="t-4">{c.heading}</h3>
            {c.paragraphs.map((p) => (
              <p key={p} className="t-body mt-3 text-ink">
                {p}
              </p>
            ))}
            {c.bullets && (
              <Rows mark="dot" className="mt-4">
                {c.bullets.map((b) => (
                  <Row key={b}>{b}</Row>
                ))}
              </Rows>
            )}
            {c.slot === "retention-table" && <RetentionTable rows={RETENTION_ROWS} />}
          </div>
        ))}
        {section.links && (
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
            {section.links.map((l) => (
              <LinkArrow key={l.href} href={l.href}>
                {l.label}
              </LinkArrow>
            ))}
          </div>
        )}
        {section.counselNote && <CounselNote>{section.counselNote}</CounselNote>}
      </div>
    </section>
  );
}

/** The four rules as 01 to 04 numerals, then the requirements list, on near-black. */
function RangeRules() {
  const c = RANGE_RULES_COPY;
  return (
    <div className="-mx-5 sm:-mx-8 lg:mx-0">
      <Section
        theme="black"
        padded={false}
        id={c.id}
        aria-labelledby={`${c.id}-heading`}
        className={cn(ANCHOR, "grain overflow-hidden px-5 py-14 sm:px-8 sm:py-16 lg:rounded-card lg:px-12 lg:py-20")}
      >
        <div className="relative">
          <Reveal className={MEASURE}>
            <Eyebrow className="mb-3">{c.eyebrow}</Eyebrow>
            <h2 id={`${c.id}-heading`} className="t-2">
              {c.headline}
            </h2>
            <p className="t-lead mt-2 text-mist">{c.subhead}</p>
            <Stamp>Last updated {c.updated}</Stamp>
          </Reveal>

          <Numbered className="mt-12">
            {RANGE_RULES.map((rule, i) => (
              <NumberedItem key={rule} index={i} size="lg" srLabel={`Rule ${i + 1}.`} delay={i * 0.08}>
                {rule}
              </NumberedItem>
            ))}
          </Numbered>

          <div className="mt-16">
            <Reveal className={MEASURE}>
              <h3 className="t-3">{c.requirementsHeading}</h3>
              <p className="t-body mt-2 text-mist">{c.requirementsIntro}</p>
            </Reveal>
            <Numbered className="mt-8">
              {REQUIREMENTS.map((r, i) => (
                <NumberedItem key={r.text} index={i} tags={r.tags.map((t) => TAG_LABELS[t] ?? t)}>
                  {r.text}
                </NumberedItem>
              ))}
            </Numbered>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
              <p className="font-mono text-[0.8125rem] leading-[1.5] text-mist">
                {c.reviewedLabel} {REQUIREMENTS_LAST_REVIEWED}
              </p>
              <LinkArrow href={SEE_REQUIREMENTS.href}>{SEE_REQUIREMENTS.label}</LinkArrow>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

/** The acknowledgement text every shooter signs once every 12 months. */
function Acknowledgement() {
  const a = ACKNOWLEDGEMENT;
  return (
    <section id={a.id} aria-labelledby={`${a.id}-heading`} className={cn(ANCHOR, "pt-16 sm:pt-20")}>
      <Reveal className={MEASURE}>
        <Eyebrow className="mb-3">{a.eyebrow}</Eyebrow>
        <h2 id={`${a.id}-heading`} className="t-2">
          {a.headline}
        </h2>
        <p className="t-lead mt-2 text-ink-muted">{a.subhead}</p>
        <Stamp>Last updated {a.updated}</Stamp>
      </Reveal>
      <div className={cn(MEASURE, "mt-10")}>
        <div
          className="max-h-[26rem] overflow-y-auto rounded-card-sm bg-paper-2 p-6 ring-1 ring-ink/10 sm:p-8"
          tabIndex={0}
          role="region"
          aria-label={`${a.headline} Full text.`}
        >
          {a.paragraphs.map((p, i) => (
            <p key={p} className={cn("t-body text-ink", i > 0 && "mt-4")}>
              {p}
            </p>
          ))}
        </div>
        <p className="t-caption mt-5 text-ink-muted">{a.signedNote}</p>
        <CounselNote>{a.counselNote}</CounselNote>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- page */

export default function LegalPage() {
  return (
    <Section theme="light" className="pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
      <Container size="lg">
        <Reveal className="max-w-[720px]">
          <Eyebrow className="mb-4">{LEGAL_HERO.eyebrow}</Eyebrow>
          <h1 className="t-hero">{LEGAL_HERO.headline}</h1>
          <p className="t-lead mt-2 text-ink-muted">{LEGAL_HERO.subhead}</p>
          <p className="t-body-lg mt-6 max-w-[40em] text-ink-muted">{LEGAL_HERO.body}</p>
          <Stamp className="mt-6">Last updated {LEGAL_UPDATED}</Stamp>
        </Reveal>

        <div className="mt-12 grid gap-10 sm:mt-16 lg:mt-20 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[220px_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)]">
              <LegalNav items={LEGAL_NAV} label={NAV_LABEL} />
            </div>
          </div>

          <div className="min-w-0">
            {LONG_FORM_SECTIONS.map((s) => (
              <LongForm key={s.id} section={s} />
            ))}
            <RangeRules />
            <Acknowledgement />
            <div className="mt-16 border-t border-hairline pt-8 sm:mt-20">
              <LinkArrow href={BACK_TO_RESERVE.href}>{BACK_TO_RESERVE.label}</LinkArrow>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
