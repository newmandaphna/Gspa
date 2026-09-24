"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Item = { id: string; label: string };

/**
 * The anchor list for /legal. Vertical and sticky beside the text on desktop,
 * a horizontal row of chips above it on phones. Tracks the section in view
 * with IntersectionObserver; without JS it is a plain list of anchor links.
 */
export function LegalNav({ items, label, className }: { items: Item[]; label: string; className?: string }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => el !== null);
    if (!els.length) return;
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top);
          else visible.delete(e.target.id);
        }
        if (!visible.size) return;
        // The visible section nearest the top of the viewport wins.
        let best: string | null = null;
        let bestTop = Number.POSITIVE_INFINITY;
        for (const [id, top] of visible) {
          if (top < bestTop) {
            bestTop = top;
            best = id;
          }
        }
        if (best) setActive(best);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav aria-label={label} className={cn("w-full", className)}>
      <p className="t-eyebrow hidden text-ink-faint lg:block">{label}</p>
      <ul className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:mt-4 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
        {items.map((it) => {
          const on = active === it.id;
          return (
            <li key={it.id} className="shrink-0">
              <a
                href={`#${it.id}`}
                aria-current={on ? "location" : undefined}
                className={cn(
                  "inline-flex h-9 items-center whitespace-nowrap rounded-pill px-4 text-[0.9375rem] ring-1 ring-inset transition-[background-color,color,box-shadow] duration-200 ease-[var(--ease-apple)]",
                  "lg:h-auto lg:rounded-none lg:border-l lg:px-4 lg:py-2 lg:ring-0",
                  on
                    ? "bg-ink text-snow ring-ink lg:border-accent lg:bg-transparent lg:font-medium lg:text-ink"
                    : "text-ink-muted ring-ink/15 hover:bg-ink/5 hover:text-ink lg:border-hairline lg:hover:bg-transparent",
                )}
              >
                {it.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
