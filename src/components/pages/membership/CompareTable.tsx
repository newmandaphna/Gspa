import Link from "next/link";
import { Check } from "@/components/pages/membership/Art";
import { cn } from "@/lib/cn";
import type { BenefitRow } from "@/lib/content/membership";
import type { Cta } from "@/lib/content/pages/membership";

const COLS: Array<keyof Omit<BenefitRow, "label">> = ["club", "signature", "founders"];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    // Deep gold: the pure accent is about 2.3:1 on paper, under the 3:1 minimum for a non-text mark.
    return (
      <span className="inline-flex items-center justify-center text-accent-deep">
        <Check />
        <span className="sr-only">Included</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="text-ink-faint">
        <span aria-hidden="true">·</span>
        <span className="sr-only">Not included</span>
      </span>
    );
  }
  return <span className="tabular">{value}</span>;
}

/**
 * Apple-style compare table: sticky header row on wide screens, horizontal
 * scroll on phones, deep-gold checks for included, a dot for not included.
 */
export function CompareTable({
  rows,
  tiers,
  caption,
  requirements,
  className,
}: {
  rows: BenefitRow[];
  tiers: { key: string; name: string; highlight?: boolean }[];
  caption: string;
  requirements: Cta;
  className?: string;
}) {
  // `relative` keeps the absolutely positioned sr-only labels inside this scroll box;
  // otherwise they escape to the section and widen the page on phones.
  // The header is only sticky from md up: below md the box is the scroll container,
  // so a sticky header would pin inside it and cover the first row. The right-edge
  // fade sits outside the scroll box so it does not scroll away with the content.
  return (
    <div className={cn("relative", className)}>
      <div className="relative -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0 md:overflow-visible">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="static z-10 w-[34%] border-b border-hairline bg-paper/95 py-4 pr-4 text-left backdrop-blur md:sticky md:top-[var(--nav-h)]">
                <span className="t-eyebrow text-ink-muted">Benefit</span>
              </th>
              {tiers.map((t) => (
                <th key={t.key} scope="col" className="static z-10 border-b border-hairline bg-paper/95 px-3 py-4 text-left backdrop-blur md:sticky md:top-[var(--nav-h)]">
                  <span className="t-4 block">{t.name}</span>
                  {t.highlight && <span className="t-eyebrow mt-1 block text-accent-deep">Most chosen</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-hairline">
                <th scope="row" className="py-4 pr-4 text-[0.9375rem] font-medium text-ink">
                  {r.label}
                </th>
                {COLS.map((c) => (
                  <td key={c} className={cn("px-3 py-4 text-[0.9375rem] text-ink-muted", c === "signature" && "bg-paper-2/60")}>
                    <Cell value={r[c]} />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" className="py-5 pr-4 text-[0.9375rem] font-medium text-ink">
                Who can join
              </th>
              <td colSpan={COLS.length} className="px-3 py-5">
                <Link href={requirements.href} className="link-arrow text-[0.9375rem]">
                  <span>{requirements.label}</span>
                  <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">
                    <path d="M2 2l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 -right-5 w-10 bg-linear-to-l from-paper to-transparent sm:right-0 md:hidden" />
      <p className="t-caption mt-3 text-ink-faint md:hidden">Swipe sideways to compare all three tiers.</p>
    </div>
  );
}
