"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A target silhouette on a hairline rail with mono distance stops.
 * Hovering, focusing or tapping a stop slides the silhouette there in 300ms
 * and turns that tick gold. Static by default, no scroll binding.
 */

const W = 800;
const RAIL_Y = 200;
const LINE = "rgba(255,255,255,0.12)";
const LINE_STRONG = "rgba(255,255,255,0.7)";
const GOLD = "#c9a55a";

export function TargetRail({ stops, unit = "yards", className }: { stops: readonly number[]; unit?: string; className?: string }) {
  const [active, setActive] = useState(stops.length - 1);
  const min = stops[0];
  const max = stops[stops.length - 1];
  const pct = (yards: number) => 8 + ((yards - min) / (max - min)) * 84;
  const yards = stops[active] ?? max;
  const x = (W * pct(yards)) / 100;
  const scale = 1 - ((yards - min) / (max - min)) * 0.45;

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${W} 240`} className="h-auto w-full" aria-hidden="true">
        <path d={`M40 ${RAIL_Y}H${W - 40}`} stroke={LINE} strokeWidth="1" />
        {stops.map((s, i) => {
          const sx = (W * pct(s)) / 100;
          const on = i === active;
          return (
            <path
              key={s}
              d={`M${sx} ${RAIL_Y - 10}v20`}
              stroke={on ? GOLD : LINE_STRONG}
              strokeWidth={on ? 1.5 : 1}
              style={{ transition: "stroke 200ms" }}
            />
          );
        })}
        <g style={{ transform: `translate(${x}px, ${RAIL_Y - 6}px) scale(${scale})`, transformOrigin: "0 0", transition: "transform 300ms var(--ease-apple)" }}>
          <g transform="translate(-30 -90)" fill="rgba(255,255,255,0.05)" stroke={LINE_STRONG} strokeWidth="1.2" vectorEffect="non-scaling-stroke">
            <path
              d="M30 4c-7 0-12 5.5-12 13 0 5 2.5 9.5 6.5 12C14 32 4 40 3 54v36h54V54c-1-14-11-22-21.5-25C39.5 26.5 42 22 42 17c0-7.5-5-13-12-13z"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx="30" cy="52" r="11" fill="none" vectorEffect="non-scaling-stroke" />
            <circle cx="30" cy="52" r="4" fill="none" vectorEffect="non-scaling-stroke" />
          </g>
        </g>
      </svg>

      <div className="relative h-11">
        {stops.map((s, i) => (
          <button
            key={s}
            type="button"
            aria-pressed={i === active}
            aria-label={`${s} ${unit}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            style={{ left: `${pct(s)}%` }}
            className={cn(
              "absolute top-0 -translate-x-1/2 rounded-pill px-3 py-1.5 font-mono text-[0.875rem] ring-1 ring-inset transition-[color,box-shadow] duration-200",
              i === active ? "text-accent ring-accent/60" : "text-mist ring-transparent hover:text-snow",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="mt-2 font-mono text-[0.8125rem] text-mist" aria-live="polite">
        {yards} {unit}
      </p>
    </div>
  );
}
