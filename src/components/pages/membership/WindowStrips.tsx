"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { WindowStrip } from "@/lib/content/pages/membership";

/**
 * Four calendar strips of hairline squares (7 / 14 / 21 / 30) that fill gold
 * left to right when scrolled into view: 900ms per strip, 70ms stagger.
 */
export function WindowStrips({ strips, className }: { strips: WindowStrip[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const max = Math.max(...strips.map((s) => s.days));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const t = window.setTimeout(() => setOn(true), 0);
      return () => window.clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("space-y-8", className)}>
      {strips.map((s, si) => (
        <div key={s.key}>
          <div className="flex items-baseline justify-between gap-4">
            <p className="t-eyebrow text-accent">{s.label}</p>
            <span className="tabular rounded-pill px-2.5 py-1 font-mono text-[0.8125rem] text-mist ring-1 ring-inset ring-white/15">{s.days} days</span>
          </div>
          <div
            className="mt-3 grid gap-[3px] sm:gap-1"
            style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }}
            role="img"
            aria-label={`${s.label}: reserve up to ${s.days} days ahead`}
          >
            {Array.from({ length: max }).map((_, i) => {
              const active = i < s.days;
              const last = i === s.days - 1;
              return (
                <span
                  key={i}
                  className={cn(
                    "aspect-square rounded-[2px] ring-1 ring-inset transition-[background-color,box-shadow] duration-500 ease-[var(--ease-apple)]",
                    !active && "ring-white/10",
                    active && !on && "ring-white/15",
                    active && on && (last ? "bg-accent ring-accent" : "bg-accent/10 ring-accent/40"),
                  )}
                  style={{ transitionDelay: on && active ? `${si * 70 + (i / s.days) * 900}ms` : "0ms" }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
