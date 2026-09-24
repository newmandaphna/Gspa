"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { Faq as FaqItem } from "@/lib/content/faq";

/**
 * Accordion: hairline rows, one open at a time, each row deep-linkable by its
 * id (/visit#faq-lead style links use the bare faq id, e.g. #lead). The answer
 * reveals through a grid-template-rows transition so height needs no measuring.
 */
export function Faq({ items, className }: { items: FaqItem[]; className?: string }) {
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const ids = new Set(items.map((i) => i.id));
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (ids.has(id)) queueMicrotask(() => setOpen(id));
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [items]);

  return (
    <div className={cn("w-full border-t border-hairline", className)}>
      {items.map((item) => {
        const isOpen = open === item.id;
        const panelId = `faq-panel-${item.id}`;
        const buttonId = `faq-button-${item.id}`;
        return (
          <div key={item.id} id={item.id} className="scroll-mt-[calc(var(--nav-h)+1.5rem)] border-b border-hairline">
            <h3 className="m-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="group flex w-full items-start justify-between gap-6 py-5 text-left sm:py-6"
              >
                <span className="t-4">{item.q}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative mt-1 h-6 w-6 shrink-0 text-ink-faint transition-transform duration-300 ease-[var(--ease-apple)] group-hover:text-ink",
                    isOpen && "rotate-45",
                  )}
                >
                  <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-current" />
                  <span className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-current" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn("grid transition-[grid-template-rows] duration-400 ease-[var(--ease-apple)]", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
            >
              <div className="min-h-0 overflow-hidden">
                <p className={cn("max-w-[34em] pb-6 pr-12 text-[1.0625rem] leading-[1.47] text-ink-muted transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0")}>
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
