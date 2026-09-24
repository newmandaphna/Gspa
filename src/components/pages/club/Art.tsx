import { cn } from "@/lib/cn";
import { Glow, LanePerspective } from "@/components/art";
import type { LoungeIconKind } from "@/lib/content/pages/club";

/**
 * Pure SVG/CSS visuals for /club. Hairlines are 1px: rgba(255,255,255,.12)
 * on dark, #d2d2d7 on light. Each artwork carries at most one accent element.
 */

const DARK_LINE = "rgba(255,255,255,0.12)";
const DARK_LINE_STRONG = "rgba(255,255,255,0.34)";
const LIGHT_LINE = "#d2d2d7";
const GOLD = "#c9a55a";

/* ---------------------------------------------------------------- air */

/** Twelve parallel arrows that draw left to right once a parent gets `.in-view`. */
export function AirFlow({ className }: { className?: string }) {
  const rows = 12;
  return (
    <svg viewBox="0 0 1200 380" className={cn("h-auto w-full", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => {
        const y = 30 + i * 29;
        return (
          <g key={i} fill="none" stroke={LIGHT_LINE} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d={`M40 ${y}H1088`} pathLength={1} className="draw" style={{ transitionDelay: `${i * 55}ms` }} />
            <path d={`M1078 ${y - 8}L1088 ${y}L1078 ${y + 8}`} pathLength={1} className="draw" style={{ transitionDelay: `${700 + i * 55}ms` }} />
          </g>
        );
      })}
      {/* filter at the right edge */}
      <g fill="none" stroke={LIGHT_LINE} strokeWidth="1">
        <rect x="1118" y="16" width="56" height="348" rx="6" />
        <path d="M1132 16v348M1160 16v348" />
      </g>
      <path d="M1146 16v348" fill="none" stroke={GOLD} strokeWidth="1" pathLength={1} className="draw" style={{ transitionDelay: "1000ms" }} />
    </svg>
  );
}

/* ------------------------------------------------------------- suites */

/**
 * Two suites with the shared wall dashed. The caller owns the width: `cn` does not
 * merge conflicting utilities, so a base `w-full` would beat a passed `w-28`.
 */
export function SuitePlan({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 100" className={cn("h-auto", className ?? "w-full")} aria-hidden="true">
      <g fill="none" stroke={LIGHT_LINE} strokeWidth="1">
        <rect x="10.5" y="10.5" width="110" height="80" rx="3" />
        <rect x="120.5" y="10.5" width="110" height="80" rx="3" />
        {/* two lanes per suite */}
        <path d="M65.5 10.5v52M175.5 10.5v52" />
        <path d="M10.5 62.5h110M120.5 62.5h110" />
        {/* targets */}
        <circle cx="38" cy="18" r="2.5" />
        <circle cx="93" cy="18" r="2.5" />
        <circle cx="148" cy="18" r="2.5" />
        <circle cx="203" cy="18" r="2.5" />
        {/* sofas */}
        <rect x="40" y="70" width="50" height="10" rx="3" />
        <rect x="150" y="70" width="50" height="10" rx="3" />
      </g>
      <path d="M120.5 10.5v80" fill="none" stroke={GOLD} strokeWidth="1" strokeDasharray="4 3" />
    </svg>
  );
}

/** Fallback art for SUITE_PHOTO_02: a dark suite, two lanes behind glass and a sofa. */
export function SuitePhotoArt() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(160deg,#2c2c2e_0%,#151516_60%,#0a0a0b_100%)]">
      <Glow variant="accent" className="left-1/2 top-[30%] h-[70%] w-[46%] -translate-x-1/2" />
      <svg viewBox="0 0 800 342" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <g fill="none" stroke={DARK_LINE} strokeWidth="1">
          <rect x="220.5" y="50.5" width="140" height="190" rx="2" />
          <rect x="440.5" y="50.5" width="140" height="190" rx="2" />
          <path d="M80 270h640" />
          <path d="M120 300h560" />
          <rect x="300.5" y="278.5" width="200" height="34" rx="10" />
        </g>
        <g fill="none" stroke={DARK_LINE_STRONG} strokeWidth="1">
          <circle cx="290" cy="130" r="14" />
          <circle cx="290" cy="130" r="5" />
          <circle cx="510" cy="130" r="14" />
          <circle cx="510" cy="130" r="5" />
        </g>
        <circle cx="290" cy="130" r="2" fill={GOLD} />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------- simulator */

/** A dark rectangle with scanlines, a slow sweep, a plate rack and one accent reticle. */
export function Scanline({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-card bg-[#0a0a0b] ring-1 ring-white/10", className)} aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)" }}
      />
      <div
        className="absolute inset-x-0 h-24"
        style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.06), transparent)", animation: "sl-sweep 7s linear infinite" }}
      />
      <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke={DARK_LINE} strokeWidth="1">
          <path d="M0 250h800M400 0v500" />
          <path d="M0 125h800M0 375h800M200 0v500M600 0v500" opacity="0.6" />
          {/* plate rack */}
          <path d="M160 420h480" />
          {[220, 310, 400, 490, 580].map((x) => (
            <circle key={x} cx={x} cy="392" r="22" />
          ))}
          {[220, 310, 400, 490, 580].map((x) => (
            <path key={`s${x}`} d={`M${x} 414v6`} />
          ))}
        </g>
        <g fill="none" stroke={GOLD} strokeWidth="1.2">
          <circle cx="400" cy="250" r="44" />
          <circle cx="400" cy="250" r="14" />
          <path d="M400 190v20M400 290v20M340 250h20M440 250h20" strokeLinecap="round" />
        </g>
      </svg>
      {label && <span className="absolute left-5 top-4 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-mist">{label}</span>}
      <style>{`@keyframes sl-sweep{0%{top:-6rem}100%{top:100%}}`}</style>
    </div>
  );
}

/* ------------------------------------------------------------- lounge */

export function LoungeIcon({ kind, className }: { kind: LoungeIconKind; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 28 28" className={cn("h-7 w-7", className)} aria-hidden="true" {...common}>
      {kind === "cup" && (
        <>
          <path d="M5 9h13v6a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5V9z" />
          <path d="M18 11h2a3 3 0 0 1 0 6h-2" />
          <path d="M4 24h16" />
        </>
      )}
      {kind === "towel" && (
        <>
          <rect x="4" y="6" width="20" height="5" rx="1" />
          <rect x="6" y="12" width="16" height="5" rx="1" />
          <rect x="8" y="18" width="12" height="5" rx="1" />
        </>
      )}
      {kind === "wifi" && (
        <>
          <path d="M3 11a15.5 15.5 0 0 1 22 0" />
          <path d="M7 15a10 10 0 0 1 14 0" />
          <path d="M11 19a5 5 0 0 1 6 0" />
          <circle cx="14" cy="23" r="1" fill="currentColor" />
        </>
      )}
      {kind === "glass" && (
        <>
          <rect x="4" y="5" width="20" height="18" rx="1.5" />
          <path d="M8 21L20 7" />
          <path d="M13 21l7-8" />
        </>
      )}
    </svg>
  );
}

/** Fallback art for LOUNGE_PHOTO_02: a light room, the window to the line, a table and a cup. */
export function LoungePhotoArt() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#f5f5f7_0%,#fbfbfd_100%)]">
      <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <g fill="none" stroke={LIGHT_LINE} strokeWidth="1">
          {/* window to the line */}
          <rect x="120.5" y="80.5" width="560" height="250" rx="2" />
          <path d="M400.5 80.5v250" />
          <path d="M120 420h560" />
          {/* far targets */}
          <circle cx="260" cy="200" r="16" />
          <circle cx="260" cy="200" r="6" />
          <circle cx="540" cy="200" r="16" />
          <circle cx="540" cy="200" r="6" />
          {/* table and cups */}
          <ellipse cx="400" cy="470" rx="150" ry="26" />
          <path d="M400 496v60" />
          <path d="M340 556h120" />
          <path d="M360 450h22v9a6 6 0 0 1-6 6h-10a6 6 0 0 1-6-6v-9z" />
          <path d="M382 452h4a3 3 0 0 1 0 6h-4" />
        </g>
        <circle cx="260" cy="200" r="2" fill={GOLD} />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------ lockers */

/** A grid of hairline locker doors, one drawn open in gold. */
export function LockerGrid({ className }: { className?: string }) {
  const cols = 8;
  const rows = 3;
  const w = 88;
  const h = 112;
  const gap = 10;
  const open = { r: 1, c: 4 };
  return (
    <svg viewBox="0 0 800 386" className={cn("h-auto w-full", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const x = 8 + c * (w + gap);
          const y = 10 + r * (h + gap);
          const isOpen = r === open.r && c === open.c;
          return (
            <g key={`${r}-${c}`} fill="none" strokeWidth="1">
              <rect x={x + 0.5} y={y + 0.5} width={w} height={h} rx="4" fill={isOpen ? "#0a0a0b" : "#151516"} stroke={DARK_LINE} />
              {!isOpen && (
                <>
                  <path d={`M${x + 22} ${y + 16}h${w - 44}M${x + 22} ${y + 22}h${w - 44}M${x + 22} ${y + 28}h${w - 44}`} stroke={DARK_LINE} />
                  <path d={`M${x + w - 16} ${y + h / 2 - 8}v16`} stroke={DARK_LINE_STRONG} />
                </>
              )}
              {isOpen && (
                <>
                  <path d={`M${x + 12} ${y + 18}h${w - 24}M${x + 12} ${y + 40}h${w - 24}`} stroke={DARK_LINE} />
                  <polygon
                    points={`${x + 0.5},${y + 0.5} ${x + 44},${y + 20} ${x + 44},${y + h - 20} ${x + 0.5},${y + h + 0.5}`}
                    fill="rgba(201,165,90,0.08)"
                    stroke={GOLD}
                    strokeLinejoin="round"
                  />
                  <path d={`M${x + 34} ${y + h / 2 - 6}v12`} stroke={GOLD} />
                </>
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
}

/** Line illustration of a brush, a mat and a bore light. */
export function ServiceTools({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" className={cn("h-auto w-full", className)} aria-hidden="true">
      <g fill="none" stroke={DARK_LINE_STRONG} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        {/* mat */}
        <rect x="20.5" y="118.5" width="360" height="62" rx="8" />
        <rect x="30.5" y="128.5" width="340" height="42" rx="5" strokeDasharray="3 4" opacity="0.7" />
        {/* brush */}
        <path d="M58 40l118 56" />
        <path d="M62 32l118 56" />
        <path d="M58 40a4.5 4.5 0 0 1 4-8" />
        <path d="M176 96l30 14M180 88l30 12M174 100l28 18M184 84l28 10" />
        <path d="M176 96l8-8" />
        {/* bore light */}
        <rect x="264.5" y="44.5" width="64" height="24" rx="12" />
        <path d="M282 44v-8M300 44v-8" />
        <path d="M328 56l52-22M328 56l52 22" opacity="0.7" />
        <path d="M380 34v44" opacity="0.4" />
      </g>
    </svg>
  );
}

/* --------------------------------------------------------------- hero */

/** Fallback art for CLUB_PHOTO_01. */
export function ClubPhotoArt() {
  return <LanePerspective />;
}
