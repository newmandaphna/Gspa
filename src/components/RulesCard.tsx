"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/config/site";
import { REQUIREMENTS, REQUIREMENTS_LAST_REVIEWED, type RequirementTag } from "@/lib/content/requirements";

/**
 * The requirements set as the printed card that sits at the desk: 5.5 by 8.5,
 * paper, the display serif at 15 px, numbered 1 to 18. The applies-to tags
 * become superscript letters keyed to a legend at the foot. On desktop the
 * card sits 0.6 degrees off square with a soft shadow, as if put down by hand.
 * "Print this card" prints only the card.
 *
 * The 5.5 by 8.5 ratio is the preferred size; when the eighteen lines run
 * longer than the card at a narrow width, the card grows rather than clips.
 */

const PAPER = "#f3efe6";

/** Superscript keys, in the order they appear in the legend. "all" carries no mark. */
const TAG_KEYS: ReadonlyArray<{ tag: RequirementTag; key: string; label: string }> = [
  { tag: "handgun", key: "H", label: "Handguns" },
  { tag: "longgun", key: "L", label: "Long guns" },
  { tag: "simulator", key: "S", label: "Simulator" },
  { tag: "training", key: "T", label: "Training" },
  { tag: "guests", key: "G", label: "Guests" },
  { tag: "members", key: "M", label: "Members" },
];

function keysFor(tags: RequirementTag[]): string[] {
  return TAG_KEYS.filter((k) => tags.includes(k.tag)).map((k) => k.key);
}

/** Bracketed counsel notes print lighter than the rule they sit in. */
function withBrackets(text: string): React.ReactNode[] {
  return text.split(/(\[[^\]]*\])/).map((part, i) =>
    part.startsWith("[") ? (
      <span key={i} className="text-[#6e6e73]">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/**
 * Print only the card. Everything that is not the card, inside the card, or
 * on the path down to it is removed from layout (display none, not
 * visibility hidden, which would keep every band above the card and print
 * them as blank sheets), the ancestors lose their padding and backgrounds so
 * the card starts at the top of page one, and the card never splits.
 */
const PRINT_CSS = `
@media print {
  @page { margin: 0.5in; }
  body > *:not(:has([data-rules-card])) { display: none !important; }
  body *:not([data-rules-card]):not([data-rules-card] *):not(:has([data-rules-card])) { display: none !important; }
  body :has([data-rules-card]) { padding: 0 !important; margin: 0 !important; min-height: 0 !important; background: none !important; display: block !important; }
  [data-rules-card] { width: 5.5in; max-width: none; margin: 0; transform: none; box-shadow: none; break-inside: avoid; page-break-inside: avoid; }
}
`;

export function RulesCard({ className, print = true }: { className?: string; print?: boolean }) {
  const legend = TAG_KEYS.filter((k) => REQUIREMENTS.some((r) => r.tags.includes(k.tag)));
  return (
    <div className={cn("relative", className)}>
      <style>{PRINT_CSS}</style>
      <article
        data-rules-card
        aria-labelledby="rules-card-title"
        className="mx-auto flex aspect-[11/17] w-full max-w-[528px] flex-col bg-[#f3efe6] px-7 py-8 text-[#1d1d1f] shadow-[0_2px_6px_rgba(0,0,0,0.25),0_30px_60px_rgba(0,0,0,0.45)] [font-family:var(--font-display)] text-[15px] leading-[1.4] sm:px-9 sm:py-10 md:rotate-[0.6deg]"
        style={{ backgroundColor: PAPER }}
      >
        <header className="flex items-baseline justify-between gap-4 border-b border-[#1d1d1f]/20 pb-3">
          <div>
            <p id="rules-card-title" className="text-[19px] leading-none">
              {SITE.name}
            </p>
            <p className="mt-1 font-sans text-[11px] uppercase tracking-[0.14em] text-[#6e6e73]">Requirements</p>
          </div>
          <p className="text-right font-mono text-[10px] leading-[1.4] text-[#6e6e73]">
            {SITE.address.line1}
            <br />
            {SITE.address.city}, {SITE.address.state} {SITE.address.zip}
          </p>
        </header>

        <ol className="m-0 mt-4 flex-1 list-none p-0">
          {REQUIREMENTS.map((r, i) => {
            const keys = keysFor(r.tags);
            return (
              <li key={r.text} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-1 py-[0.3em]">
                <span className="tabular text-[#6e6e73]" aria-hidden="true">
                  {i + 1}.
                </span>
                <p className="m-0">
                  <span className="sr-only">Requirement {i + 1}. </span>
                  {withBrackets(r.text)}
                  {keys.length > 0 && (
                    <sup className="ml-1 font-sans text-[9px] tracking-[0.08em] text-[#6e6e73]">
                      <span className="sr-only">Applies to {keys.map((k) => TAG_KEYS.find((t) => t.key === k)?.label).join(", ")}</span>
                      <span aria-hidden="true">{keys.join(" ")}</span>
                    </sup>
                  )}
                </p>
              </li>
            );
          })}
        </ol>

        <footer className="mt-5 border-t border-[#1d1d1f]/20 pt-3 font-sans text-[10px] leading-[1.5] text-[#6e6e73]">
          <p className="m-0 flex flex-wrap gap-x-3 gap-y-0.5">
            {legend.map((k) => (
              <span key={k.key}>
                <span className="font-semibold text-[#1d1d1f]">{k.key}</span> {k.label}
              </span>
            ))}
            <span>No mark, everyone</span>
          </p>
          <p className="m-0 mt-2 font-mono text-[10px] uppercase tracking-[0.1em]">Reviewed {REQUIREMENTS_LAST_REVIEWED}</p>
        </footer>
      </article>
      {print && (
        <div className="mt-8 flex justify-center">
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            Print this card
          </Button>
        </div>
      )}
    </div>
  );
}
