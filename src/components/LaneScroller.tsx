"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Below sm the floor plans scroll sideways at 72 px a lane with scroll-snap.
 * On mount, on a phone, the strip starts on lanes 5 to 8 so the middle of the
 * line is in view and a lane peeks on each side. At sm and up it is a plain
 * block and the plan fits the column.
 */
export function LaneScroller({ startAt = 4, className, children }: { startAt?: number; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(max-width: 639px)").matches) return;
    const tiles = el.querySelectorAll<HTMLElement>("[data-lane]");
    const target = tiles[startAt];
    if (!target) return;
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    const left = target.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft - pad;
    el.scrollLeft = Math.max(0, left);
  }, [startAt]);
  return (
    <div ref={ref} className={cn("no-scrollbar -mx-5 snap-x snap-mandatory overflow-x-auto scroll-px-6 sm:mx-0 sm:snap-none sm:overflow-visible", className)}>
      {children}
    </div>
  );
}
