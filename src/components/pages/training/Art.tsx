import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Rung } from "@/lib/content/pages/training";

/**
 * Training page visuals. Pure SVG/CSS, no imagery. Hairlines are 1px:
 * rgba(255,255,255,.12) on dark, #d2d2d7 on light. One gold element per piece.
 */

const GOLD = "#c9a55a";
const GOLD_2 = "#e0c98a";
const GOLD_DEEP = "#7f6430";
const HAIR_DARK = "rgba(255,255,255,0.12)";
const HAIR_LIGHT = "#d2d2d7";

/* ------------------------------------------------------------------------
   Hero: a hairline target with 24 grouping dots. Wide scatter at the left,
   tightening to a cluster centre-right. The last five are gold. Dots appear
   with a 40ms stagger on mount.
   --------------------------------------------------------------------- */
const DOTS = (() => {
  // Deterministic jitter so server and client render the same marks.
  let seed = 7;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff - 0.5;
  };
  const cx = 540;
  const cy = 225;
  return Array.from({ length: 24 }, (_, i) => {
    const t = i / 23;
    const ease = t * t;
    const spreadX = 150 * (1 - ease) + 6;
    const spreadY = 170 * (1 - ease) + 6;
    return {
      x: 150 + (cx - 150) * ease + rand() * spreadX,
      y: cy + rand() * spreadY,
    };
  });
})();

export function GroupingTarget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" className={cn("h-full w-full", className)} aria-hidden="true">
      <defs>
        <radialGradient id="tg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={GOLD_2} stopOpacity="0.22" />
          <stop offset="0.6" stopColor={GOLD_2} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tg-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0a0b" />
          <stop offset="1" stopColor="#151516" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#tg-floor)" />
      <circle cx="540" cy="225" r="240" fill="url(#tg-glow)" />
      {[36, 72, 108, 144, 180].map((r) => (
        <circle key={r} cx="540" cy="225" r={r} fill="none" stroke={HAIR_DARK} strokeWidth="1" />
      ))}
      <path d="M540 25v20M540 405v20M340 225h20M720 225h20" stroke={HAIR_DARK} strokeWidth="1" strokeLinecap="round" />
      {/* the shooter's line, far left */}
      <line x1="60" y1="60" x2="60" y2="390" stroke={HAIR_DARK} strokeWidth="1" />
      {DOTS.map((d, i) => {
        const gold = i >= DOTS.length - 5;
        return (
          <circle
            key={i}
            cx={d.x.toFixed(1)}
            cy={d.y.toFixed(1)}
            r={gold ? 2.6 : 2.2}
            fill={gold ? GOLD : "#f5f5f7"}
            opacity={gold ? 1 : 0.85}
            style={{ animation: `tg-pop 0.5s ${0.3 + i * 0.04}s var(--ease-apple) both`, transformBox: "fill-box", transformOrigin: "center" }}
          />
        );
      })}
      <style>{`@keyframes tg-pop{0%{opacity:0;transform:scale(0.2)}100%{transform:scale(1)}}`}</style>
    </svg>
  );
}

/* ------------------------------------------------------------------------
   The ladder: five ascending treads drawn with hairlines. The tread under
   the pointer turns gold. Bookable treads link into the reservation flow.
   --------------------------------------------------------------------- */
export function Ladder({ rungs, className }: { rungs: ReadonlyArray<Rung>; className?: string }) {
  return (
    <ol className={cn("grid grid-cols-1 gap-3 sm:grid-cols-5 sm:items-end sm:gap-0", className)}>
      {rungs.map((r, i) => {
        const inner = (
          <>
            <span className="flex items-start justify-between gap-2">
              <span className="t-eyebrow text-ink">
                <span className="font-mono normal-case tracking-normal text-ink-faint">{String(i + 1).padStart(2, "0")} </span>
                {r.label}
              </span>
              {r.chip && (
                <span className="inline-flex shrink-0 items-center rounded-pill px-2.5 py-1 font-mono text-[0.6875rem] text-ink-muted ring-1 ring-inset ring-ink/15">
                  {r.chip}
                </span>
              )}
            </span>
            <span className="tabular mt-3 block font-mono text-[0.8125rem] text-ink-muted">
              {r.duration && r.price ? `${r.duration} · ${r.price}` : r.duration || r.price || "Details to follow"}
            </span>
          </>
        );
        // `sm:min-h-24` keeps one-line and two-line titles the same card height so the steps stay even.
        const tread =
          "group block h-full rounded-card-sm border-t border-l border-hairline bg-paper px-4 pt-4 pb-5 transition-[border-color,background-color] duration-300 ease-[var(--ease-apple)] sm:min-h-24";
        return (
          <li key={r.slug} className="sm:flex sm:flex-col sm:justify-end">
            {r.href ? (
              <Link href={r.href} className={cn(tread, "hover:border-accent-deep hover:bg-paper-2 focus-visible:border-accent-deep")}>
                {inner}
              </Link>
            ) : (
              <div className={cn(tread, "opacity-70")}>{inner}</div>
            )}
            {/* The spacer sits under the tread: with the row bottom-aligned, each tread rises 44px per rung. */}
            <div className="hidden sm:block" style={{ height: `${i * 44}px` }} aria-hidden="true" />
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------------
   First Session: five stops on a rail, on near-black. Dots fill gold in sequence.
   --------------------------------------------------------------------- */
export function StepRail({ steps, className }: { steps: ReadonlyArray<string>; className?: string }) {
  return (
    <ol className={cn("relative grid", className)} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      <div aria-hidden="true" className="pointer-events-none absolute left-[10%] right-[10%] top-[7px] h-px bg-white/15" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[10%] top-[7px] h-px w-0 bg-accent transition-[width] duration-[1400ms] ease-[var(--ease-apple)] [.in-view_&]:w-[80%]"
        style={{ transitionDelay: "0.2s" }}
      />
      {steps.map((label, i) => (
        <li key={label} className="flex flex-col items-center px-0.5 text-center">
          <span
            aria-hidden="true"
            className="block h-[15px] w-[15px] scale-50 rounded-full bg-night-2 ring-1 ring-inset ring-white/25 transition-[transform,background-color,box-shadow] duration-500 ease-[var(--ease-apple)] [.in-view_&]:scale-100 [.in-view_&]:bg-accent [.in-view_&]:ring-accent"
            style={{ transitionDelay: `${0.25 + i * 0.22}s` }}
          />
          {/* On phones the number stacks above the word and the tracking tightens so five labels fit in ~70px columns. */}
          <span className="t-eyebrow mt-4 text-[0.5625rem] tracking-[0.1em] text-mist sm:text-[0.75rem] sm:tracking-[0.16em]">
            <span className="block font-mono normal-case tracking-normal text-mist/70 sm:inline">{String(i + 1).padStart(2, "0")} </span>
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------------
   Private: two overlapping rounded rectangles joined by one gold hairline.
   --------------------------------------------------------------------- */
export function PairDiagram({ left, right, className }: { left: string; right: string; className?: string }) {
  return (
    <svg viewBox="0 0 640 360" className={cn("h-full w-full", className)} aria-hidden="true">
      <rect x="70" y="70" width="300" height="200" rx="28" fill="#f5f5f7" stroke={HAIR_LIGHT} strokeWidth="1" />
      <rect x="270" y="110" width="300" height="200" rx="28" fill="#f5f5f7" stroke={HAIR_LIGHT} strokeWidth="1" fillOpacity="0.92" />
      <line x1="220" y1="170" x2="420" y2="210" stroke={GOLD_DEEP} strokeWidth="1" pathLength={1} className="draw" />
      <circle cx="220" cy="170" r="3" fill={GOLD_DEEP} />
      <circle cx="420" cy="210" r="3" fill={GOLD_DEEP} />
      <text x="96" y="104" fontFamily="var(--font-mono)" fontSize="13" fill="#6e6e73">
        {left}
      </text>
      <text x="544" y="290" fontFamily="var(--font-mono)" fontSize="13" fill="#6e6e73" textAnchor="end">
        {right}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------------
   Courses: a month grid with two consecutive weekend dates ringed gold.
   --------------------------------------------------------------------- */
export function MonthGrid({ ringed, className }: { ringed: ReadonlyArray<number>; className?: string }) {
  const cols = 7;
  const cell = 56;
  const pad = 20;
  const days = 30;
  const firstDow = 1; // the 1st falls on a Monday in this placeholder month
  const rows = Math.ceil((days + firstDow) / cols);
  const w = pad * 2 + cell * cols;
  const h = pad * 2 + 30 + cell * rows;
  const dow = ["S", "M", "T", "W", "T", "F", "S"];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-auto w-full", className)} aria-hidden="true">
      {dow.map((d, i) => (
        <text key={i} x={pad + i * cell + cell / 2} y={pad + 12} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="#a1a1a6">
          {d}
        </text>
      ))}
      {Array.from({ length: rows + 1 }).map((_, r) => (
        <line key={`r${r}`} x1={pad} y1={pad + 30 + r * cell} x2={w - pad} y2={pad + 30 + r * cell} stroke={HAIR_DARK} strokeWidth="1" />
      ))}
      {Array.from({ length: cols + 1 }).map((_, c) => (
        <line key={`c${c}`} x1={pad + c * cell} y1={pad + 30} x2={pad + c * cell} y2={pad + 30 + rows * cell} stroke={HAIR_DARK} strokeWidth="1" />
      ))}
      {Array.from({ length: days }).map((_, i) => {
        const day = i + 1;
        const idx = i + firstDow;
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        const x = pad + c * cell + cell / 2;
        const y = pad + 30 + r * cell + cell / 2;
        const hot = ringed.includes(day);
        return (
          <g key={day}>
            {hot && <circle cx={x} cy={y} r={18} fill="none" stroke={GOLD} strokeWidth="1.2" pathLength={1} className="draw" />}
            <text x={x} y={y + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="13" fill={hot ? GOLD_2 : "#a1a1a6"}>
              {day}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Twelve hairline circles, one per classroom seat. */
export function SeatDots({ count, className }: { count: number; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="block h-3.5 w-3.5 scale-75 rounded-full ring-1 ring-inset ring-white/25 transition-[transform,opacity] duration-500 ease-[var(--ease-apple)] [.in-view_&]:scale-100"
          style={{ transitionDelay: `${0.1 + i * 0.05}s` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------
   Simulator: a 16:9 screen with a hairline decision tree. Root at left, four
   leaves at right, one branch draws in gold on reveal. Leaf labels in mono.
   --------------------------------------------------------------------- */
export function DecisionTree({
  root,
  branches,
  leaves,
  goldLeaf,
  className,
}: {
  root: string;
  branches: ReadonlyArray<string>;
  leaves: ReadonlyArray<string>;
  goldLeaf: number;
  className?: string;
}) {
  const rootP = { x: 90, y: 225 };
  const mid = [
    { x: 380, y: 130 },
    { x: 380, y: 320 },
  ];
  const leafP = [
    { x: 660, y: 80 },
    { x: 660, y: 180 },
    { x: 660, y: 270 },
    { x: 660, y: 370 },
  ];
  const curve = (a: { x: number; y: number }, b: { x: number; y: number }) => `M${a.x} ${a.y} C ${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x} ${b.y}`;
  const goldMid = goldLeaf < 2 ? 0 : 1;
  const stroke = { fill: "none", strokeWidth: 1 };
  return (
    <svg viewBox="0 0 800 450" className={cn("h-full w-full", className)} aria-hidden="true">
      <rect width="800" height="450" fill="#f5f5f7" />
      {mid.map((m, i) => (
        <path key={`m${i}`} d={curve(rootP, m)} stroke={HAIR_LIGHT} {...stroke} />
      ))}
      {leafP.map((l, i) => (
        <path key={`l${i}`} d={curve(mid[i < 2 ? 0 : 1], l)} stroke={HAIR_LIGHT} {...stroke} />
      ))}
      {/* the gold branch, root to leaf, drawn in on reveal */}
      <path d={curve(rootP, mid[goldMid])} stroke={GOLD_DEEP} strokeWidth="1.4" fill="none" pathLength={1} className="draw" />
      <path d={curve(mid[goldMid], leafP[goldLeaf])} stroke={GOLD_DEEP} strokeWidth="1.4" fill="none" pathLength={1} className="draw" style={{ transitionDelay: "0.5s" }} />
      {/* nodes */}
      <circle cx={rootP.x} cy={rootP.y} r="5" fill="#fbfbfd" stroke={HAIR_LIGHT} strokeWidth="1" />
      {mid.map((m, i) => (
        <circle key={`mc${i}`} cx={m.x} cy={m.y} r="4" fill="#fbfbfd" stroke={i === goldMid ? GOLD_DEEP : HAIR_LIGHT} strokeWidth="1" />
      ))}
      {leafP.map((l, i) => (
        <circle key={`lc${i}`} cx={l.x} cy={l.y} r="4" fill={i === goldLeaf ? GOLD_DEEP : "#fbfbfd"} stroke={i === goldLeaf ? GOLD_DEEP : HAIR_LIGHT} strokeWidth="1" />
      ))}
      {/* labels */}
      <text x={rootP.x} y={rootP.y + 26} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fill="#6e6e73">
        {root}
      </text>
      {mid.map((m, i) => (
        <text key={`mt${i}`} x={m.x} y={m.y - 14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fill="#6e6e73">
          {branches[i]}
        </text>
      ))}
      {leafP.map((l, i) => (
        <text key={`lt${i}`} x={l.x + 16} y={l.y + 4} fontFamily="var(--font-mono)" fontSize="12" fill={i === goldLeaf ? GOLD_DEEP : "#6e6e73"}>
          {leaves[i]}
        </text>
      ))}
      {/* screen bezel */}
      <rect x="0.5" y="0.5" width="799" height="449" fill="none" stroke={HAIR_LIGHT} strokeWidth="1" />
    </svg>
  );
}

/* ------------------------------------------------------------------------
   License: a horizontal process line with four nodes. Only "Course" is gold,
   because it is the only step that happens here.
   --------------------------------------------------------------------- */
export function ProcessLine({ nodes, className }: { nodes: ReadonlyArray<{ label: string; note: string; here?: boolean }>; className?: string }) {
  return (
    <ol className={cn("relative grid", className)} style={{ gridTemplateColumns: `repeat(${nodes.length}, minmax(0, 1fr))` }}>
      <div aria-hidden="true" className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[7px] h-px bg-white/15" />
      {nodes.map((n, i) => (
        <li key={n.label} className="flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className={cn(
              "block h-[15px] w-[15px] rounded-full ring-1 ring-inset transition-[transform] duration-500 ease-[var(--ease-apple)] scale-50 [.in-view_&]:scale-100",
              n.here ? "bg-accent ring-accent" : "bg-night ring-white/30",
            )}
            style={{ transitionDelay: `${0.15 + i * 0.18}s` }}
          />
          <span className={cn("t-eyebrow mt-4 text-[0.625rem] sm:text-[0.75rem]", n.here ? "text-accent" : "text-snow")}>{n.label}</span>
          <span className="mt-1 font-mono text-[0.6875rem] text-mist">{n.note}</span>
        </li>
      ))}
    </ol>
  );
}
