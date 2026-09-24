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
          <span className="block h-14 w-14 rounded-full ring-2 ring-inset ring-accent sm:h-16 sm:w-16" />
          <span className="t-footnote text-ink-muted">{labels.you}</span>
        </div>
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < guests;
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "block h-14 w-14 rounded-full ring-1 ring-inset transition-[background-color,box-shadow,transform] duration-500 ease-[var(--ease-apple)] sm:h-16 sm:w-16",
                  filled ? "scale-100 bg-ink ring-ink" : "scale-95 bg-transparent ring-hairline",
                )}
                style={{ transitionDelay: `${i * 60}ms` }}
              />
              <span className={cn("t-footnote transition-colors", filled ? "text-ink" : "text-ink-faint")}>{labels.guest}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {/* Toggle buttons in a group: a real radiogroup would promise arrow-key movement these buttons do not have. */}
        <div role="group" aria-label={labels.legend} className="inline-flex rounded-pill bg-paper-3 p-1">
          {options.map((o) => {
            const selected = o.key === key;
            return (
              <button
                key={o.key}
                type="button"
                aria-pressed={selected}
                onClick={() => setKey(o.key)}
                className={cn(
                  "h-9 rounded-pill px-4 text-[0.9375rem] font-medium transition-[background-color,color,box-shadow] duration-200 ease-[var(--ease-apple)]",
                  selected ? "bg-white text-ink shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : "text-ink-muted hover:text-ink",
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
