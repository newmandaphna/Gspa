import type { Metadata } from "next";
import Link from "next/link";
import { ApplyForm } from "@/components/pages/membership/ApplyForm";
import { HeroBeams, Nameplate, Shield } from "@/components/pages/membership/Art";
import { CompareTable } from "@/components/pages/membership/CompareTable";
import { GuestPicker } from "@/components/pages/membership/GuestPicker";
import { InView } from "@/components/pages/membership/InView";
import { WindowStrips } from "@/components/pages/membership/WindowStrips";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { Row, Rows } from "@/components/ui/List";
import { Item, Reveal, Stagger } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";
import { FOUNDERS_CAP, MEMBERSHIP_TIERS, tierByKey, type Tier } from "@/lib/content/membership";
import {
  COMPARE_CAPTION,
  COMPARE_ROWS,
  FOUNDERS_COUNTER,
  FOUNDERS_PRICE_LINE,
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
  MEMBERSHIP_HERO,
  MEMBERSHIP_META,
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

export const metadata: Metadata = {
  title: MEMBERSHIP_META.title,
  description: MEMBERSHIP_META.description,
};

/* ------------------------------------------------------------ helpers */

/** Headline block: eyebrow, headline, subhead (8px gap), body (24px of air), optional link. */
function Head({ copy, align = "left", className }: { copy: SectionCopy; align?: "left" | "center"; className?: string }) {
  return (
    <Reveal className={cn("max-w-[720px]", align === "center" && "mx-auto text-center", className)}>
      {copy.eyebrow && <Eyebrow className="mb-4">{copy.eyebrow}</Eyebrow>}
      <h2 className="t-1">{copy.headline}</h2>
      <p className="t-lead mt-2 text-muted">{copy.subhead}</p>
      <p className={cn("t-body-lg mt-6 max-w-[40em] text-muted", align === "center" && "mx-auto")}>{copy.body}</p>
      {copy.cta && (
        <LinkArrow href={copy.cta.href} className="mt-6">
          {copy.cta.label}
        </LinkArrow>
      )}
    </Reveal>
  );
}

function TierCard({ tier }: { tier: Tier }) {
  const lifted = Boolean(tier.highlight);
  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-card bg-white p-7 ring-1 ring-ink/10 sm:p-8",
        lifted ? "shadow-[var(--shadow-card)] lg:-translate-y-2" : "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
      )}
    >
      {lifted && <span aria-hidden="true" className="absolute inset-x-7 top-0 h-px bg-accent sm:inset-x-8" />}
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="t-4">{tier.name}</h3>
        {lifted && <span className="t-eyebrow text-accent-deep">{TIER_CARD.mostChosen}</span>}
      </div>
      <p className="mt-6 flex items-baseline gap-2">
        <span className="t-numeral text-[clamp(4.5rem,9vw,7.5rem)]">{tier.bookingWindowDays}</span>
        <span className="t-caption text-ink-muted">{TIER_CARD.windowUnit}</span>
      </p>
      <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
        <span className="t-3 tabular">{tier.price}</span>
        <span className="t-caption text-ink-muted">{tier.priceNote}</span>
      </p>
      {tier.altPrice && <p className="t-caption tabular mt-1 text-ink-muted">{tier.altPrice}</p>}
      {tier.limited && <p className="mt-2 font-mono text-[0.75rem] text-accent-deep">{tier.limited}</p>}
      <p className="t-body mt-4 text-ink">{tier.tagline}</p>
      <Rows mark="check" size="sm" className="mt-6 flex-1">
        {tier.perks.map((p) => (
          <Row key={p}>{p}</Row>
        ))}
      </Rows>
      <Button href={TIER_CARD.cta.href} variant={lifted ? "primary" : "secondary"} className="mt-7 w-full">
        {TIER_CARD.cta.label}
      </Button>
    </article>
  );
}

/* --------------------------------------------------------------- page */

export default function MembershipPage() {
  const founders = tierByKey("founders");
  const foundersCap = FOUNDERS_CAP;

  return (
    <>
      {/* HERO */}
      <Section theme="black" padded={false} className="grain flex min-h-[100dvh] items-center overflow-hidden pt-[var(--nav-h)] pb-20">
        <HeroBeams />
        <Container className="relative py-16 sm:py-24">
          <Reveal className="mx-auto max-w-[820px] text-center">
            {MEMBERSHIP_HERO.eyebrow && <Eyebrow className="mb-5">{MEMBERSHIP_HERO.eyebrow}</Eyebrow>}
            <h1 className="t-hero gradient-text">{MEMBERSHIP_HERO.headline}</h1>
            <p className="t-lead mt-2 text-mist">{MEMBERSHIP_HERO.subhead}</p>
            <p className="t-body-lg mx-auto mt-6 max-w-[34em] text-mist">{MEMBERSHIP_HERO.body}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              {MEMBERSHIP_HERO.cta && (
                <Button href={MEMBERSHIP_HERO.cta.href} variant="accent" size="lg">
                  {MEMBERSHIP_HERO.cta.label}
                </Button>
              )}
              {MEMBERSHIP_HERO.secondary && <LinkArrow href={MEMBERSHIP_HERO.secondary.href}>{MEMBERSHIP_HERO.secondary.label}</LinkArrow>}
            </div>
            <p className="t-caption mt-10 text-mist">
              {HERO_SIGN_IN.prefix}{" "}
              <Link href={HERO_SIGN_IN.href} className="text-accent-2 underline underline-offset-4 hover:text-snow">
                {HERO_SIGN_IN.label}
              </Link>
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* TIERS */}
      <Section theme="light" id="tiers" className="scroll-mt-[var(--nav-h)]">
        <Container>
          <Head copy={MEMBERSHIP_TIERS_COPY} />
          <Stagger className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-3 lg:items-stretch">
            {MEMBERSHIP_TIERS.map((t) => (
              <Item key={t.key} className="h-full">
                <TierCard tier={t} />
              </Item>
            ))}
          </Stagger>
          <Reveal className="mt-16 lg:mt-24">
            <h3 className="t-2">Compare tiers.</h3>
            <p className="t-body-lg mt-2 max-w-[40em] text-ink-muted">{COMPARE_CAPTION}</p>
            <CompareTable rows={COMPARE_ROWS} tiers={MEMBERSHIP_TIERS} caption={COMPARE_CAPTION} requirements={REQUIREMENTS_LINK} className="mt-8" />
          </Reveal>
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

      {/* FOUNDERS */}
      <Section theme="gray" id="founders" className="scroll-mt-[var(--nav-h)]">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <Head copy={MEMBERSHIP_FOUNDERS} />
            <Reveal delay={0.1}>
              <ImageSlot slot="FOUNDERS_WALL_01" alt={FOUNDERS_WALL_ALT} className="aspect-[16/9] rounded-card ring-1 ring-ink/10" art={<Nameplate cap={foundersCap} />} />
              <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <p className="tabular font-mono text-[0.8125rem] text-ink-muted">{FOUNDERS_COUNTER}</p>
                {founders && <p className="t-caption tabular text-ink-muted">{FOUNDERS_PRICE_LINE}</p>}
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* APPLY */}
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
