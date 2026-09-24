import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import Link from "next/link";
import { RulesCard } from "@/components/RulesCard";
import { Container } from "@/components/ui/Container";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { Section } from "@/components/ui/Section";
import { SITE } from "@/lib/config/site";
import { HOUSE_RULES, HOUSE_RULES_DRAFT_LINE, RANGE_OFFICER_LINE, RANGE_RULES, RANGE_RULES_LABEL } from "@/lib/content/requirements";

const HEAD = {
  eyebrow: "House rules",
  headline: "Ten rules, each with a reason",
  subhead: "The decision first, then why. The way the desk says them.",
  requirements: { label: "Every requirement, in one list", href: "/visit#requirements" },
  card: { eyebrow: "The card at the desk", headline: "The eighteen lines counsel reads." },
} as const;

export const metadata: Metadata = pageMeta("/house-rules", {
  title: "House Rules",
  description: `The house rules at ${SITE.name}: the four rules every range posts, then ten of the club's own, each a decision with its reason. Printed card of the requirements included.`,
});

export default function HouseRulesPage() {
  return (
    <>
      <Section theme="black" className="pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
        <Container size="md">
          <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-mist">{HOUSE_RULES_DRAFT_LINE}</p>
          <p className="t-eyebrow mt-10 text-accent">{HEAD.eyebrow}</p>
          <h1 className="t-hero mt-4 max-w-[12em]">{HEAD.headline}</h1>
          <p className="t-lead mt-4 max-w-[30em] text-mist">{HEAD.subhead}</p>

          {/* The four every range posts, in a small framed block */}
          <aside aria-label={RANGE_RULES_LABEL} className="mt-14 max-w-[560px] rounded-card-sm p-6 ring-1 ring-white/15 sm:p-7">
            <p className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-mist">{RANGE_RULES_LABEL}</p>
            <ol className="m-0 mt-4 list-none space-y-2 p-0">
              {RANGE_RULES.map((rule, i) => (
                <li key={rule} className="grid grid-cols-[1.5rem_minmax(0,1fr)] t-body text-snow">
                  <span className="font-mono text-[0.8125rem] text-mist" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span>
                    <span className="sr-only">Rule {i + 1}. </span>
                    {rule}
                  </span>
                </li>
              ))}
            </ol>
          </aside>

          {/* The ten of our own */}
          <ol className="m-0 mt-20 list-none border-t border-white/15 p-0">
            {HOUSE_RULES.map((rule, i) => (
              <li key={rule.decision} className="grid grid-cols-[3rem_minmax(0,1fr)] items-baseline border-b border-white/15 py-8 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:py-10">
                <span className="tabular font-mono text-[0.8125rem] text-mist" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="t-2 max-w-[18em]">
                    <span className="sr-only">House rule {i + 1}. </span>
                    {rule.decision}
                  </p>
                  <p className="t-body-lg mt-3 max-w-[34em] text-mist">{rule.reason}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="t-caption mt-8 max-w-[40em] text-mist">{RANGE_OFFICER_LINE}</p>
          <div className="mt-6">
            <LinkArrow href={HEAD.requirements.href}>{HEAD.requirements.label}</LinkArrow>
          </div>
        </Container>
      </Section>

      {/* The requirements as the printed card */}
      <Section theme="black" className="border-t border-white/10">
        <Container size="md">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="t-eyebrow text-mist">{HEAD.card.eyebrow}</p>
              <h2 className="t-1 mt-4">{HEAD.card.headline}</h2>
              <p className="t-body-lg mt-6 max-w-[30em] text-mist">
                Every line the desk checks at the door, the same list the reservation flow reads. The letters after a line say who it applies to. Brackets mean counsel is still on it.{" "}
                <Link href="/legal#range-rules" className="underline underline-offset-2 hover:text-snow">
                  The legal page
                </Link>{" "}
                has the same text with the tags spelled out.
              </p>
            </div>
            <RulesCard />
          </div>
        </Container>
      </Section>
    </>
  );
}
