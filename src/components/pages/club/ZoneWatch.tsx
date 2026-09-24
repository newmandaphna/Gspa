"use client";

import { useEffect, useRef, useState } from "react";
import { FloorPlan } from "@/components/pages/club/FloorPlan";
import type { ZoneKey } from "@/lib/content/pages/club";
import { cn } from "@/lib/cn";

/**
 * The club page's one device. The isometric plan sits in the left column,
 * pinned at lg, while the air, targets, suites, simulator, lounge and locker
 * blocks scroll past on the right. Each block carries data-zone; the one that
 * crosses the middle of the viewport lights its zone on the plan. Below lg the
 * plan sits above the blocks and still lights as they pass.
 */
export function ZoneWatch({ caption, children, className }: { caption: React.ReactNode; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ZoneKey | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const blocks = el.querySelectorAll<HTMLElement>("[data-zone]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.zone as ZoneKey);
        }
      },
      // A thin band across the middle of the viewport: a block is "current" while it crosses it.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    blocks.forEach((b) => io.observe(b));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("grid gap-14 lg:grid-cols-12 lg:gap-12", className)}>
      <div className="lg:col-span-6 lg:self-start lg:sticky lg:top-[calc(var(--nav-h)+2.5rem)]">
        <FloorPlan active={active} />
        <div className="mt-8">{caption}</div>
      </div>
      <div className="lg:col-span-6">{children}</div>
    </div>
  );
}
