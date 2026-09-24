"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Adds the `in-view` class once the wrapper scrolls into view, so `.draw`
 * paths inside animate their stroke. Adds it immediately when
 * IntersectionObserver is unavailable.
 */
export function InView({ children, className, rootMargin = "0px 0px -15% 0px" }: { children: React.ReactNode; className?: string; rootMargin?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in-view");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("in-view");
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
