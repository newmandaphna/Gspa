import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import Link from "next/link";
import { ApplyForm } from "@/components/pages/membership/ApplyForm";
import { Shield } from "@/components/pages/membership/Art";
import { CompareTable } from "@/components/pages/membership/CompareTable";
import { FoundersRequest } from "@/components/pages/membership/FoundersRequest";
import { GuestPicker } from "@/components/pages/membership/GuestPicker";
import { InView } from "@/components/pages/membership/InView";
import { WindowStrips } from "@/components/pages/membership/WindowStrips";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { Row, Rows } from "@/components/ui/List";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";
import { FOUNDERS_CAP, MEMBERSHIP_TIERS, tierByKey, type Tier } from "@/lib/content/membership";
import {
  COMPARE_CAPTION,
  COMPARE_DETAILS,
  COMPARE_ROWS,
  FOUNDERS_PRICE_LINE,
  FOUNDERS_WALL,
  FOUNDERS_WALL_ALT,
  GUEST_MAX,
  GUEST_NOTE,
  GUEST_OPTIONS,
  GUEST_PICKER_LABELS,
  HERO_SIGN_IN,
  HIGHLIGHT_TIER,
  MEMBERSHIP_APPLY,
  MEMBERSHIP_FOUNDERS,
  MEMBERSHIP_GUESTS,
  MEMBERSHIP_META,
  MEMBERSHIP_OPENING,
  MEMBERSHIP_TIERS_COPY,
  MEMBERSHIP_VETTING,
  MEMBERSHIP_WINDOWS,
  PORTAL_UNLOCKS,
  REQUIREMENTS_LINK,
  TIER_CARD,
  VETTING_LINK,
  VETTING_STEPS,
  VETTING_VENDOR_LINE,
  WINDOW_STRIPS,
  type SectionCopy,
} from "@/lib/content/pages/membership";
import { foundersCount } from "@/lib/members/service";

/** The Founders count is read from the members table on every request. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMeta("/membership", {
  title: MEMBERSHIP_META.title,
  description: MEMBERSHIP_META.description,
});

/* ------------------------------------------------------------ helpers */

/** Names on the wall today. Null when the database cannot be reached, so the page still renders. */
async function loadFoundersTaken(): Promise<number | null> {
  try {
    return await foundersCount();
  } catch (err) {
    console.error("[membership] founders count failed", err);
    return null;
  }
}

/** Headline block: eyebrow, headline, subhead (8px gap), body (24px of air), optional link. */
function Head({ copy, align = "left", className }: { copy: SectionCopy; align?: "left" | "center"; className?: string }) {
  return (
    <Reveal className={cn("max-w-[720px]", align === "center" && "mx-auto text-center", className)}>
      {copy.eyebrow && <Eyebrow className="mb-4">{copy.eyebrow}</Eyebrow>}
      <h2 className="t-1">{copy.headline}</h2>
      {copy.subhead && <p className="t-lead mt-2 text-muted">{copy.subhead}</p>}
      <p className={cn("t-body-lg mt-6 max-w-[40em] text-muted", align === "center" && "mx-auto")}>{copy.body}</p>
      {copy.cta && (
        <LinkArrow href={copy.cta.href} className="mt-6">
          {copy.cta.label}
        </LinkArrow>
      )}
    </Reveal>
  );
}

/** A flat dark plane behind the two photo slots until the photographs exist. No beams, no grain. */
function DarkPlane({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("absolute inset-0 bg-night", className)} />;
}

function tierCta(tier: Tier) {
  return tier.key === "founders" ? TIER_CARD.foundersCta : TIER_CARD.cta;
}

/** Signature, the wide column: the numeral, the price, the buyer sentence, the three perks that differ, Apply. */
function TierCard({ tier }: { tier: Tier }) {
  const cta = tierCta(tier);
  return (
    <article className="relative flex flex-col rounded-card bg-white p-7 ring-1 ring-ink/10 sm:p-9">
      {tier.highlight && <span aria-hidden="true" className="absolute inset-x-7 top-0 h-px bg-accent sm:inset-x-9" />}
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="t-3">{tier.name}</h3>
        {tier.highlight && <span className="t-eyebrow text-accent-deep">{TIER_CARD.mostChosen}</span>}
      </div>
      <p className="mt-6 flex items-baseline gap-3">
        <span className="t-numeral">{tier.bookingWindowDays}</span>
        <span className="t-caption text-ink-muted">{TIER_CARD.windowUnit}</span>
      </p>
      <p className="mt-8 flex flex-wrap items-baseline gap-x-2">
        <span className="t-3 tabular">{tier.price}</span>
        <span className="t-caption text-ink-muted">{tier.priceNote}</span>
      </p>
      {tier.altPrice && <p className="t-caption tabular mt-1 text-ink-muted">{tier.altPrice}</p>}
      <p className="t-body-lg mt-6 max-w-[30em] text-ink">{tier.forWhom}</p>
      <Rows mark="check" size="sm" className="mt-6">
        {tier.differs.map((p) => (
          <Row key={p}>{p}</Row>
        ))}
      </Rows>
      <Button href={cta.href} variant="primary" className="mt-8 w-full sm:w-auto sm:self-start">
        {cta.label}
      </Button>
    </article>
  );
}

/** Club and Founders as hairline rows beside the card: same facts, less room. */
function TierRow({ tier, last }: { tier: Tier; last?: boolean }) {
  const cta = tierCta(tier);
  return (
    <article className={cn("border-t border-hairline py-8", last && "border-b")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="t-3">{tier.name}</h3>
        {tier.limited && <span className="font-mono text-[0.75rem] text-accent-deep">{tier.limited}</span>}
      </div>
      <p className="mt-4 flex items-baseline gap-3">
        <span className="t-2 tabular">{tier.bookingWindowDays}</span>
        <span className="t-caption text-ink-muted">{TIER_CARD.windowUnit}</span>
      </p>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
        <span className="t-4 tabular">{tier.price}</span>
        <span className="t-caption text-ink-muted">{tier.priceNote}</span>
      </p>
      {tier.altPrice && <p className="t-caption tabular mt-1 text-ink-muted">{tier.altPrice}</p>}
      <p className="t-body mt-4 max-w-[30em] text-ink">{tier.forWhom}</p>
      <Rows mark="check" size="sm" className="mt-4">
        {tier.differs.map((p) => (
          <Row key={p}>{p}</Row>
        ))}
      </Rows>
      <Button href={cta.href} variant="secondary" size="sm" className="mt-6">
        {cta.label}
      </Button>
    </article>
  );
}

/* --------------------------------------------------------------- page */

export default async function MembershipPage() {
  const founders = tierByKey("founders");
  const taken = await loadFoundersTaken();
  const remaining = taken === null ? null : Math.max(0, FOUNDERS_CAP - taken);
  const full = remaining === 0;
  const wide = MEMBERSHIP_TIERS.find((t) => t.highlight) ?? HIGHLIGHT_TIER;
  const rows = MEMBERSHIP_TIERS.filter((t) => t.key !== wide.key);

  return (
    <>
      {/* OPENING: left-aligned on the member card photograph; a plain dark band until it exists. */}
      <Section theme="black" padded={false} className="relative flex min-h-[88dvh] items-end overflow-hidden pt-[var(--nav-h)]">
        <ImageSlot slot="MEMBER_CARD_01" alt={MEMBERSHIP_OPENING.photoAlt} fill priority sizes="100vw" art={<DarkPlane />} />
        {/* Scrim so the headline sits on the photograph's darkest third; invisible on the plain band. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.35)_45%,transparent_100%)]" />
        <Container className="relative pt-24 pb-16 sm:pt-32 sm:pb-20">
          <p className="enter font-mono text-[0.75rem] uppercase tracking-[0.08em] text-mist">{MEMBERSHIP_OPENING.runningHead}</p>
          <h1 className="enter t-display mt-5 max-w-[9em] text-snow" style={{ "--enter-delay": "80ms" } as React.CSSProperties}>
            {MEMBERSHIP_OPENING.headline}
          </h1>
          <p className="enter t-body-lg mt-6 max-w-[34em] text-mist" style={{ "--enter-delay": "160ms" } as React.CSSProperties}>
            {MEMBERSHIP_OPENING.body}
          </p>
          <div className="enter mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8" style={{ "--enter-delay": "240ms" } as React.CSSProperties}>
            <Button href={MEMBERSHIP_OPENING.secondary.href} variant="accent" size="lg">
              {MEMBERSHIP_OPENING.secondary.label}
            </Button>
            <p className="t-caption text-mist">
              {HERO_SIGN_IN.prefix}{" "}
              <Link href={HERO_SIGN_IN.href} className="text-accent-2 underline underline-offset-4 hover:text-snow">
                {HERO_SIGN_IN.label}
              </Link>
            </p>
          </div>
        </Container>
      </Section>

      {/* THE WALL: the live count at display size, then the conversation. */}
      <Section theme="dark" id="founders" padded={false} className="relative scroll-mt-[var(--nav-h)] overflow-hidden">
        <ImageSlot slot="FOUNDERS_WALL_01" alt={FOUNDERS_WALL_ALT} fill sizes="100vw" art={<DarkPlane className="bg-night-2" />} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(29,29,31,0.92)_0%,rgba(29,29,31,0.7)_55%,rgba(29,29,31,0.5)_100%)]" />
        <Container className="relative py-20 sm:py-28 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <p className="font-mono text-[0.75rem] uppercase tracking-[0.08em] text-mist">{FOUNDERS_WALL.runningHead}</p>
              {remaining === null ? (
                <p className="t-numeral mt-6 text-snow">{FOUNDERS_CAP}</p>
              ) : (
                <p className="mt-6 flex items-baseline gap-4">
                  <span className="t-numeral text-snow" aria-live="polite">
                    {remaining}
                  </span>
                  <span className="font-mono text-[0.8125rem] uppercase tracking-[0.08em] text-mist">{FOUNDERS_WALL.remainingLabel(remaining)}</span>
                </p>
              )}
              {taken !== null && <p className="tabular mt-3 font-mono text-[0.8125rem] text-mist">{FOUNDERS_WALL.namesUp(taken)}</p>}
              {FOUNDERS_WALL.firstOnWall && <p className="t-body mt-3 max-w-[30em] text-mist">{FOUNDERS_WALL.firstOnWall}</p>}

              <div className="mt-12 border-t border-white/12 pt-8">
                {full ? (
                  <>
                    <h2 className="t-2 text-snow">{FOUNDERS_WALL.full.headline}</h2>
                    <p className="t-lead t-italic mt-2 text-mist">{FOUNDERS_WALL.full.subhead}</p>
                    <p className="t-body-lg mt-6 max-w-[34em] text-mist">{FOUNDERS_WALL.full.body}</p>
                  </>
                ) : (
                  <>
                    <h2 className="t-2 text-snow">{MEMBERSHIP_FOUNDERS.subhead}</h2>
                    <p className="t-body-lg mt-6 max-w-[34em] text-mist">{MEMBERSHIP_FOUNDERS.body}</p>
                  </>
                )}
                {founders && <p className="t-caption tabular mt-6 text-mist">{FOUNDERS_PRICE_LINE}</p>}
              </div>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <FoundersRequest waitlist={full} />
            </div>
          </div>
        </Container>
      </Section>

      {/* TIERS: Signature wide, Club and Founders as hairline rows; the only page that keeps the numerals. */}
      <Section theme="light" id="tiers" className="scroll-mt-[var(--nav-h)]">
        <Container>
          <Head copy={MEMBERSHIP_TIERS_COPY} />
          <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7 lg:self-start">
              <TierCard tier={wide} />
            </div>
            <div className="lg:col-span-5 lg:pt-2">
              {rows.map((t, i) => (
                <TierRow key={t.key} tier={t} last={i === rows.length - 1} />
              ))}
            </div>
          </div>

          {/* The full grid, closed by default. */}
          <details className="group mt-16 border-t border-hairline lg:mt-24">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="t-2 block">{COMPARE_DETAILS.summary}</span>
                <span className="t-caption mt-1 block text-ink-muted">{COMPARE_DETAILS.hint}</span>
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="shrink-0 text-ink transition-transform duration-300 ease-[var(--ease-apple)] group-open:rotate-45"
              >
                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="pb-6">
              <p className="t-body-lg max-w-[40em] text-ink-muted">{COMPARE_CAPTION}</p>
              <CompareTable rows={COMPARE_ROWS} tiers={MEMBERSHIP_TIERS} caption={COMPARE_CAPTION} requirements={REQUIREMENTS_LINK} className="mt-8" />
            </div>
          </details>
        </Container>
      </Section>

      {/* WINDOWS */}
      <Section theme="dark" id="windows" className="scroll-mt-[var(--nav-h)]">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Head copy={MEMBERSHIP_WINDOWS} />
            <Reveal delay={0.1} className="lg:pt-6">
              <WindowStrips strips={WINDOW_STRIPS} />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* GUESTS */}
      <Section theme="light" id="guests" className="scroll-mt-[var(--nav-h)]">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Head copy={MEMBERSHIP_GUESTS} />
            <Reveal delay={0.1} className="lg:pt-6">
              <GuestPicker options={GUEST_OPTIONS} max={GUEST_MAX} initial={HIGHLIGHT_TIER.key} labels={GUEST_PICKER_LABELS} />
              <p className="mt-8 font-mono text-[0.8125rem] text-ink-muted">{GUEST_NOTE}</p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* VETTING */}
      <Section theme="black" id="vetting" className="grain scroll-mt-[var(--nav-h)] overflow-hidden">
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Head copy={MEMBERSHIP_VETTING} />
              <Reveal delay={0.1} className="mt-8">
                <p className="font-mono text-[0.8125rem] text-mist">{VETTING_VENDOR_LINE}</p>
                <LinkArrow href={VETTING_LINK.href} className="mt-3 text-mist">
                  {VETTING_LINK.label}
                </LinkArrow>
              </Reveal>
            </div>
            <InView className="lg:pt-6">
              <ol className="relative border-l border-white/12 pl-8">
                {VETTING_STEPS.map((s, i) => {
                  const last = i === VETTING_STEPS.length - 1;
                  return (
                    <Reveal key={s.title} as="li" delay={i * 0.08} className={cn("relative list-none pb-10", last && "pb-0")}>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute -left-8 flex -translate-x-1/2 items-center justify-center",
                          last ? "top-0 h-7 w-7 rounded-full bg-night ring-1 ring-white/12" : "top-2 h-2.5 w-2.5 rounded-full bg-night ring-1 ring-white/35",
                        )}
                      >
                        {last && <Shield className="h-4 w-4" />}
                      </span>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h3 className="t-eyebrow text-snow">{s.title}</h3>
                        <span className="tabular rounded-pill px-2.5 py-1 font-mono text-[0.75rem] text-mist ring-1 ring-inset ring-white/15">{s.when}</span>
                      </div>
                      <p className="t-body mt-2 max-w-[36em] text-mist">{s.body}</p>
                    </Reveal>
                  );
                })}
              </ol>
            </InView>
          </div>

          <Reveal className="mt-20 border-t border-white/10 pt-12 lg:mt-28">
            <Eyebrow className="mb-4">{PORTAL_UNLOCKS.eyebrow}</Eyebrow>
            <h3 className="t-2">{PORTAL_UNLOCKS.headline}</h3>
            <ul className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              {PORTAL_UNLOCKS.services.map((svc) => (
                <li key={svc.title} className="border-t border-white/10 pt-4">
                  <p className="t-4 text-snow">{svc.title}</p>
                  <p className="t-caption mt-1 text-mist">{svc.description}</p>
                  {svc.minTier && <p className="mt-2 font-mono text-[0.75rem] text-accent">{PORTAL_UNLOCKS.minTierNote(tierByKey(svc.minTier)?.name ?? svc.minTier)}</p>}
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </Section>

      {/* APPLY: the page ends here. */}
      <Section theme="black" id="apply" className="grain scroll-mt-[var(--nav-h)] overflow-hidden">
        <Container className="relative" size="md">
          <Head copy={MEMBERSHIP_APPLY} align="center" />
          <Reveal delay={0.1} className="mt-12">
            <ApplyForm tiers={MEMBERSHIP_TIERS.map((t) => ({ key: t.key, name: t.name, screeningFeeWaived: t.screeningFeeWaived }))} initialTier={HIGHLIGHT_TIER.key} />
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
