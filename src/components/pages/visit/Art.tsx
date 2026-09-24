import { cn } from "@/lib/cn";
import type { BringItem, TransitLine } from "@/lib/content/pages/visit";

/**
 * Visuals for /visit. Pure SVG and CSS so the page looks finished before any
 * photography exists. Hairlines are 1px: rgba(255,255,255,.12) on dark,
 * #d2d2d7 on light. One gold element per artwork at most.
 */

const GOLD = "#c9a55a";
const HAIR_DARK = "rgba(255,255,255,0.12)";
const HAIR_LIGHT = "#d2d2d7";

/** Gold map pin. Used in the hero and at the end of the transit sketch. */
export function MapPin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" className={cn("h-8 w-6", className)} aria-hidden="true">
      <path d="M12 1.5c-5.2 0-9.5 4.2-9.5 9.4 0 7 9.5 19.6 9.5 19.6s9.5-12.6 9.5-19.6c0-5.2-4.3-9.4-9.5-9.4z" fill="none" stroke={GOLD} strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="3.4" fill="none" stroke={GOLD} strokeWidth="1.4" />
      <circle cx="12" cy="11" r="1" fill={GOLD} />
    </svg>
  );
}

/**
 * Fallback for [EXTERIOR_PHOTO_01]: near-black to #1c1c20, a faint street grid
 * turned a few degrees so it reads as a map rather than graph paper, and a
 * vignette that leaves the middle open for the headline.
 */
export function ExteriorArt() {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="vx-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#1c1c20" />
        </linearGradient>
        <pattern id="vx-grid" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-12) translate(40 20)">
          <path d="M0 0.5H120M0.5 0V120" fill="none" stroke={HAIR_DARK} strokeWidth="1" />
        </pattern>
        <pattern id="vx-blocks" width="360" height="360" patternUnits="userSpaceOnUse" patternTransform="rotate(-12) translate(40 20)">
          <path d="M0 0.5H360M0.5 0V360" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        </pattern>
        <radialGradient id="vx-vignette" cx="50%" cy="55%" r="65%">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#vx-bg)" />
      <rect width="1600" height="900" fill="url(#vx-grid)" />
      <rect width="1600" height="900" fill="url(#vx-blocks)" />
      {/* two avenues crossing near the station */}
      <path d="M-100 690 L1700 330" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
      <path d="M560 -50 L1040 950" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
      <rect width="1600" height="900" fill="url(#vx-vignette)" />
    </svg>
  );
}

const ORIGINS: Record<TransitLine["id"], { x: number; y: number; anchor: "start" | "middle" | "end" }> = {
  lirr: { x: 60, y: 70, anchor: "start" },
  subway: { x: 400, y: 40, anchor: "middle" },
  airtrain: { x: 740, y: 70, anchor: "end" },
};

const PIN = { x: 400, y: 300 };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Three hairlines with station dots converging on a gold pin. Paths carry the
 * `draw` class and animate when a parent gets `in-view`. Labels are HTML so
 * they stay legible at phone width.
 */
export function TransitSketch({ lines, className }: { lines: TransitLine[]; className?: string }) {
  return (
    <div className={cn("relative w-full", className)}>
      <svg viewBox="0 0 800 360" className="h-auto w-full" aria-hidden="true">
        {lines.map((line, li) => {
          const o = ORIGINS[line.id];
          const mid = { x: lerp(o.x, PIN.x, 0.5) + (o.anchor === "middle" ? 0 : o.anchor === "start" ? 40 : -40), y: lerp(o.y, PIN.y, 0.5) - 30 };
          const d = `M${o.x} ${o.y} Q${mid.x} ${mid.y} ${PIN.x} ${PIN.y - 26}`;
          return (
            <g key={line.id}>
              <path d={d} pathLength={1} className="draw" fill="none" stroke="#6e6e73" strokeWidth="1" style={{ transitionDelay: `${li * 150}ms` }} />
              {line.stops.map((stop, si) => {
                const t = (si + 1) / (line.stops.length + 1);
                // point on the quadratic curve
                const x = (1 - t) * (1 - t) * o.x + 2 * (1 - t) * t * mid.x + t * t * PIN.x;
                const y = (1 - t) * (1 - t) * o.y + 2 * (1 - t) * t * mid.y + t * t * (PIN.y - 26);
                return <circle key={stop} cx={x} cy={y} r="4" fill="#fbfbfd" stroke="#6e6e73" strokeWidth="1" />;
              })}
              <circle cx={o.x} cy={o.y} r="5" fill="#fbfbfd" stroke="#6e6e73" strokeWidth="1" />
            </g>
          );
        })}
        {/* the pin: the one gold element */}
        <g transform={`translate(${PIN.x - 12} ${PIN.y - 32})`}>
          <path d="M12 1.5c-5.2 0-9.5 4.2-9.5 9.4 0 7 9.5 19.6 9.5 19.6s9.5-12.6 9.5-19.6c0-5.2-4.3-9.4-9.5-9.4z" fill="none" stroke={GOLD} strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="12" cy="11" r="3.4" fill="none" stroke={GOLD} strokeWidth="1.4" />
          <circle cx="12" cy="11" r="1" fill={GOLD} />
        </g>
        <line x1="0" y1="340" x2="800" y2="340" stroke={HAIR_LIGHT} strokeWidth="1" />
      </svg>
      {lines.map((line) => {
        const o = ORIGINS[line.id];
        const left = (o.x / 800) * 100;
        const top = (o.y / 360) * 100;
        return (
          <span
            key={line.id}
            className={cn(
              "absolute font-mono text-[0.75rem] leading-none text-ink-muted",
              o.anchor === "middle" && "-translate-x-1/2",
              o.anchor === "end" && "-translate-x-full",
            )}
            style={{ left: `${left}%`, top: `calc(${top}% + 12px)` }}
          >
            {line.label}
          </span>
        );
      })}
      <span className="absolute left-1/2 -translate-x-1/2 font-mono text-[0.75rem] leading-none text-accent-deep" style={{ top: `calc(${(PIN.y / 360) * 100}% + 10px)` }}>
        The Gun Spa
      </span>
    </div>
  );
}

/** Fallback for [MAP_EMBED]: a #f5f5f7 field with a faint street grid and a mono label. */
export function MapPlaceholderArt({ label }: { label: string }) {
  return (
    <div className="relative h-full w-full bg-paper-2">
      <svg viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="vm-grid" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
            <path d="M0 0.5H80M0.5 0V80" fill="none" stroke={HAIR_LIGHT} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1200" height="500" fill="url(#vm-grid)" />
        <path d="M-50 380 L1250 160" stroke="#c7c7cc" strokeWidth="1" />
        <path d="M420 -30 L780 530" stroke="#c7c7cc" strokeWidth="1" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center px-6 text-center font-mono text-[0.8125rem] text-ink-muted">{label}</span>
    </div>
  );
}

/** Line icons for "What to bring": ID card, shoe, calm face. One gold mark each. */
export function BringIcon({ kind, className }: { kind: BringItem["id"]; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 96 64" className={cn("h-16 w-24", className)} aria-hidden="true">
      {kind === "id" && (
        <>
          <rect x="8" y="10" width="80" height="44" rx="6" {...common} />
          <circle cx="28" cy="30" r="7" {...common} stroke={GOLD} />
          <path d="M17 46c1.5-6 5.5-9 11-9s9.5 3 11 9" {...common} />
          <path d="M48 24h30M48 33h30M48 42h18" {...common} />
        </>
      )}
      {kind === "shoes" && (
        <>
          <path d="M10 44c0-3 1.5-5 5-6l14-4c3-1 5-3 6-6l3-8c1-2 3-3 5-2l4 2c2 1 3 3 2 5l-1 3c4 6 12 10 22 12 8 1.5 14 4 16 8v4H10v-8z" {...common} />
          <path d="M10 52h76" {...common} />
          <path d="M40 30l6 3M45 25l6 3" {...common} />
          <circle cx="76" cy="44" r="2" fill={GOLD} stroke="none" />
        </>
      )}
      {kind === "calm" && (
        <>
          <circle cx="48" cy="30" r="22" {...common} />
          <path d="M37 28c2-3 6-3 8 0M51 28c2-3 6-3 8 0" {...common} />
          <path d="M42 38c3 2 9 2 12 0" {...common} />
          <path d="M30 60c6-4 12-4 18 0s12 4 18 0" {...common} stroke={GOLD} />
        </>
      )}
    </svg>
  );
}
