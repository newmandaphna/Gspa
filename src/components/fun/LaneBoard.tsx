"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Twelve lanes as the numbers painted on the floor at the firing line. When the
 * board scrolls into view the lane lights come up one after another, left to
 * right, the way the range opens in the morning. Hover a lane to see it lit and
 * reserve it by number.
 */
/** `href` is a template; `{lane}` becomes the two-digit lane number. */
export function LaneBoard({ count, yards, href }: { count: number; yards: number; href: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setLit(count));
      return;
    }
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        let n = 0;
        timer = window.setInterval(() => {
          n += 1;
          setLit(n);
          if (n >= count) window.clearInterval(timer);
        }, 110);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, [count]);

  return (
    <div ref={ref}>
      <div className="flex items-baseline justify-between font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-mist">
        <span>Target line · {yards} yd</span>
        <span>{String(lit).padStart(2, "0")} / {count} lit</span>
      </div>
      <ol className="no-scrollbar mt-4 grid snap-x snap-mandatory auto-cols-[minmax(4.5rem,1fr)] grid-flow-col gap-[3px] overflow-x-auto sm:overflow-visible">
        {Array.from({ length: count }, (_, i) => {
          const n = i + 1;
          const on = n <= lit;
          return (
            <li key={n} className="snap-start">
              <a
                href={href.replace("{lane}", String(n).padStart(2, "0"))}
                aria-label={`Reserve lane ${n}`}
                className={cn(
                  "group/lane relative flex h-[clamp(14rem,30vw,22rem)] flex-col justify-end overflow-hidden rounded-[2px] bg-night-3 transition-colors duration-500",
                  on && "bg-[#221f1b]",
                )}
              >
                {/* The downlight: a warm pool that fades in when the lane is lit, brighter on hover. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(227,201,140,0.28),transparent_70%)] opacity-0 transition-opacity duration-700",
                    on && "opacity-100",
                    "group-hover/lane:opacity-100 group-hover/lane:[filter:brightness(1.6)]",
                  )}
                />
                {/* Target on its carrier, far down the lane */}
                <span aria-hidden="true" className={cn("absolute left-1/2 top-[14%] h-7 w-5 -translate-x-1/2 rounded-[1px] bg-[#e9e2d2] opacity-30 transition-opacity duration-700", on && "opacity-90")}>
                  <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-night" />
                </span>
                <span
                  className={cn(
                    "t-stencil relative block px-2 pb-3 text-center text-[clamp(2.5rem,5vw,4rem)] leading-none text-night-4 transition-colors duration-500",
                    on && "text-accent",
                    "group-hover/lane:text-accent-2",
                  )}
                >
                  {String(n).padStart(2, "0")}
                </span>
                <span aria-hidden="true" className={cn("relative block h-[3px] bg-night-4 transition-colors duration-500", on && "bg-accent")} />
              </a>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex items-baseline justify-between font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-mist">
        <span>Firing line</span>
        <span>Own air, every lane</span>
      </div>
    </div>
  );
}
