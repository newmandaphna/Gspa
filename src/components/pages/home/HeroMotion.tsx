"use client";

import { useRef } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * The two scroll-linked moves the home page owns. Both read scroll position
 * directly (no fade-ups), and both stand still under prefers-reduced-motion.
 */

/** The hero picture grows from 1 to 1.12 and drifts up 8 percent across the first viewport. */
export function HeroArt({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);
  return (
    <motion.div ref={ref} className={cn("will-change-transform", className)} style={reduce ? undefined : { scale, y }}>
      {children}
    </motion.div>
  );
}

/**
 * Scrolling walks the firing line: as the plan crosses the viewport, lane
 * labels 01 to 12 turn gold in order. The plan itself is a server component
 * (FloorPlan), so this wrapper finds its lane tiles by role and colors the
 * label span directly; if the markup changes, nothing lights and nothing breaks.
 */
export function LaneWalk({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const lit = useRef(-1);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 90%", "end 40%"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (reduce || !ref.current) return;
    const lanes = ref.current.querySelectorAll<HTMLElement>('[role="listitem"]');
    const n = Math.round(Math.min(1, Math.max(0, v)) * lanes.length);
    if (n === lit.current) return;
    lit.current = n;
    lanes.forEach((lane, i) => {
      const on = i < n;
      lane.dataset.lit = on ? "true" : "false";
      const label = lane.querySelector<HTMLElement>(":scope > span:not([aria-hidden])");
      if (label) label.style.color = on ? "var(--color-accent)" : "";
    });
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
