"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Wrapper element. */
  as?: "div" | "figure" | "section";
  /** IntersectionObserver rootMargin; negative bottom margin delays the reveal until the art is well inside the viewport. */
  rootMargin?: string;
  threshold?: number;
};

/**
 * Adds the class "in-view" to its wrapper once it scrolls into view, so any
 * child SVG path with the "draw" class animates its stroke in (see globals.css).
 * Adds it immediately when IntersectionObserver is unavailable. Reduced motion
 * is honored by the CSS itself.
 */
export function InView({ children, className, as: Tag = "div", rootMargin = "0px 0px -12% 0px", threshold = 0.2 }: Props) {
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
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("in-view");
          io.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold]);

  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={cn(className)}>
      {children}
    </Tag>
  );
}
