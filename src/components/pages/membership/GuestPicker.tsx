"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { GuestOption } from "@/lib/content/pages/membership";

/**
 * One gold-outlined circle (you) and three grey circles (guests). The
 * segmented control fills one, two or three of them by tier.
 */
export function GuestPicker({
  options,
  max,
  initial,
  labels,
  className,
}: {
  options: GuestOption[];
  max: number;
  initial?: GuestOption["key"];
  labels: { you: string; guest: string; legend: string };
  className?: string;
}) {
  const [key, setKey] = useState<GuestOption["key"]>(initial ?? options[0]?.key ?? "club");
  const current = options.find((o) => o.key === key) ?? options[0];
  const guests = current?.guests ?? 0;

  return (
    <div className={cn("flex flex-col items-start gap-8", className)}>
      <div className="flex items-end gap-3 sm:gap-4" aria-hidden="true">
        <div className="flex flex-col items-center gap-2">
          {/* Everyone is a case head seen from the base: rim, then the primer at the center. */}
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#f0d58f,#c99a45_45%,#7a5a24)] ring-1 ring-inset ring-black/20 sm:h-16 sm:w-16">
            <span className="h-4 w-4 rounded-full bg-[radial-gradient(circle_at_40%_35%,#e8e0cf,#a39d92)] ring-1 ring-black/25" />
          </span>
          <span className="t-footnote text-ink-muted">{labels.you}</span>
        </div>
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < guests;
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full ring-1 ring-inset transition-[opacity,transform] duration-500 ease-[var(--ease-apple)] sm:h-16 sm:w-16",
                  filled ? "scale-100 bg-[radial-gradient(circle_at_35%_30%,#e39a6c,#b5673b_45%,#4a2410)] ring-black/20" : "scale-95 bg-transparent ring-hairline",
                )}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className={cn("h-4 w-4 rounded-full ring-1", filled ? "bg-[radial-gradient(circle_at_40%_35%,#f0d58f,#c99a45)] ring-black/25" : "ring-hairline")} />
              </span>
              <span className={cn("t-footnote transition-colors", filled ? "text-ink" : "text-ink-faint")}>{labels.guest}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {/* Toggle buttons in a group: a real radiogroup would promise arrow-key movement these buttons do not have. */}
        <div role="group" aria-label={labels.legend} className="inline-flex gap-7 border-b border-ink/15">
          {options.map((o) => {
            const selected = o.key === key;
            return (
              <button
                key={o.key}
                type="button"
                aria-pressed={selected}
                onClick={() => setKey(o.key)}
                className={cn(
                  "t-label -mb-px border-b-2 py-3 transition-[border-color,color] duration-200 ease-[var(--ease-apple)]",
                  selected ? "border-accent-deep text-ink" : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <p className="tabular font-mono text-[0.8125rem] text-ink-muted" aria-live="polite">
          {current?.label}: {guests} {guests === 1 ? "guest" : "guests"} per visit
        </p>
      </div>
    </div>
  );
}
