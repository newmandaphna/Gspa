"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Adds the class "in-view" to its wrapper once it scrolls into view, so any
 * child with a "draw" path or an "[.in-view_&]" transition animates in.
 * Reduced motion is honored by the CSS itself (globals.css).
 */
export function InView({ children, className, as: Tag = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "figure" }) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in-view");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("in-view");
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (Tag === "figure") {
    return (
      <figure ref={ref as React.RefObject<HTMLElement>} className={cn(className)}>
        {children}
      </figure>
    );
  }
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={cn(className)}>
      {children}
    </div>
  );
}
