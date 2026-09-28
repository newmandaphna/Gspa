"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A shot timer on the simulator wall: counts the scenario down in stencil
 * digits while it is on screen, then shows the par time and starts again.
 * Decorative (the numbers are made up for the scene) so it is hidden from
 * assistive technology; reduced motion shows a still reading.
 */
export function RangeTimer({ labels }: { labels: { scenario: string; bay: string; mode: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ms, setMs] = useState(42_380);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let visible = false;
    let last = 0;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    function tick(now: number) {
      raf = 0;
      const dt = last ? now - last : 0;
      last = now;
      setMs((m) => (m - dt <= 0 ? 60_000 : m - dt));
      if (visible) raf = requestAnimationFrame(tick);
      else last = 0;
    }
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  const s = Math.floor(ms / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return (
    <div ref={ref} aria-hidden="true" className="relative overflow-hidden rounded-[2px] bg-[#060606] ring-1 ring-white/[0.06]">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.025)_0px,rgba(255,255,255,0.025)_1px,transparent_1px,transparent_3px)]" />
      <div className="relative flex items-center justify-between px-5 pt-4 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-mist sm:px-7">
        <span>{labels.bay} · {labels.scenario}</span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d0342c]" />
          {labels.mode}
        </span>
      </div>
      <div className="relative flex items-end justify-center px-4 pb-8 pt-6 sm:pb-12">
        <span className="t-stencil tabular text-[clamp(5rem,17vw,15rem)] leading-[0.8] text-accent">
          00:{String(s).padStart(2, "0")}
        </span>
        <span className="t-stencil tabular mb-[0.6em] ml-2 text-[clamp(1.75rem,5vw,4rem)] leading-none text-accent/60">.{String(cs).padStart(2, "0")}</span>
      </div>
      <div className="relative grid grid-cols-3 border-t border-white/[0.06] font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-mist">
        <span className="px-5 py-3 sm:px-7">Draw 1.8 s</span>
        <span className="border-x border-white/[0.06] px-5 py-3 sm:px-7">Decision 0.6 s</span>
        <span className="px-5 py-3 sm:px-7">Hits 4 / 5</span>
      </div>
    </div>
  );
}
