import Link from "next/link";
import { LaneScroller } from "@/components/LaneScroller";
import { cn } from "@/lib/cn";
import { FACILITY } from "@/lib/config/site";
import { AVATARS, BRACKET_ROUNDS, BRACKET_TEAMS, BRACKET_WINNER_LABEL, FLOOR_PLAN_LABELS } from "@/lib/content/pages/events";

/**
 * Photography-free visuals for /events. Pure SVG/CSS. Hairlines are 1px:
 * rgba(255,255,255,.12) on dark, #d2d2d7 on light. One gold element per piece.
 * The top-down plan is the page's device; nothing else on the page draws the room.
 */

const GOLD = "#c9a55a";
const GOLD_2 = "#e0c98a";
const HAIR_DARK = "rgba(255,255,255,0.12)";
const HAIR_LIGHT = "#d2d2d7";
const MONO = "var(--font-mono)";

/* ------------------------------------------------------------------------
   Hero: the top-down floor plan with both suites tinted gold at 10%.
   Public lanes in #2c2c30. Lane count, suites and lanes per suite from FACILITY.
   --------------------------------------------------------------------- */
export function EventsFloorPlan({ className }: { className?: string }) {
  const count = FACILITY.laneCount;
  const suites = FACILITY.suites;
  const per = FACILITY.lanesPerSuite;
  const W = 1200;
  const H = 560;
  const pad = 40;
  const gap = 10;
  const laneW = (W - 2 * pad - gap * (count - 1)) / count;
  const laneTop = 56;
  const laneH = 250;
  const fireY = laneTop + laneH + 18;
  const loungeTop = fireY + 22;
  const loungeH = 150;
  const suiteStart = count - suites * per;
  const laneX = (i: number) => pad + i * (laneW + gap);
  const label = { fontFamily: MONO, fontSize: 12, letterSpacing: "0.08em" } as const;
  // Below sm the drawing is 1030 px wide so a lane is 72 px, plus a 24 px gutter each side.
  const phoneWidth = Math.round((W / laneW) * 72) + 48;

  return (
    <LaneScroller className={className}>
      {/* The phone width rides a custom property so the sm: utility can release it; an inline min-width would win over the class. */}
      <div className="relative min-w-[var(--plan-w)] px-6 sm:min-w-0 sm:px-0" style={{ "--plan-w": `${phoneWidth}px` } as React.CSSProperties}>
        <EventsFloorPlanSvg W={W} H={H} pad={pad} count={count} suites={suites} per={per} laneW={laneW} laneTop={laneTop} laneH={laneH} fireY={fireY} loungeTop={loungeTop} loungeH={loungeH} suiteStart={suiteStart} laneX={laneX} label={label} />
        {/* Lane links laid over the drawing; each is also a snap point for the phone scroll. */}
        <div className="absolute inset-y-0 left-6 right-6 sm:inset-x-0">
          {Array.from({ length: count }).map((_, i) => {
            const n = String(i + 1).padStart(2, "0");
            const isSuite = i >= suiteStart;
            return (
              <Link
                key={i}
                href={`/reserve?experience=${isSuite ? "private-suite" : "lane-session"}&lane=${n}`}
                aria-label={isSuite ? `Reserve a suite, lane ${n}` : `Reserve lane ${n}`}
                data-lane={n}
                className="absolute snap-start rounded-[6px] ring-accent/70 transition-[box-shadow] duration-300 hover:ring-1 focus-visible:ring-1"
                style={{ left: `${(laneX(i) / W) * 100}%`, width: `${(laneW / W) * 100}%`, top: `${(laneTop / H) * 100}%`, height: `${(laneH / H) * 100}%` }}
              />
            );
          })}
        </div>
      </div>
    </LaneScroller>
  );
}

type PlanGeometry = {
  W: number;
  H: number;
  pad: number;
  count: number;
  suites: number;
  per: number;
  laneW: number;
  laneTop: number;
  laneH: number;
  fireY: number;
  loungeTop: number;
  loungeH: number;
  suiteStart: number;
  laneX: (i: number) => number;
  label: { fontFamily: string; fontSize: number; letterSpacing: string };
};

function EventsFloorPlanSvg({ W, H, pad, count, suites, per, laneW, laneTop, laneH, fireY, loungeTop, loungeH, suiteStart, laneX, label }: PlanGeometry) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden="true">
      {/* target line */}
      <text x={pad} y={40} fill="rgba(161,161,166,0.8)" style={label}>
        {FLOOR_PLAN_LABELS.targetLine.toUpperCase()}
      </text>
      <text x={W - pad} y={40} fill="rgba(161,161,166,0.8)" textAnchor="end" style={label}>
        {`${count} LANES`}
      </text>

      {/* suite shells: the one gold element */}
      {Array.from({ length: suites }).map((_, s) => {
        const first = suiteStart + s * per;
        const x0 = laneX(first) - 8;
        const x1 = laneX(first + per - 1) + laneW + 8;
        const y0 = laneTop - 14;
        const y1 = loungeTop + loungeH + 14;
        const cx = (x0 + x1) / 2;
        return (
          <g key={s}>
            <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={12} fill={GOLD} fillOpacity={0.1} stroke={GOLD} strokeOpacity={0.4} strokeWidth={1} />
            {/* sofa in the suite lounge */}
            <rect x={cx - 34} y={loungeTop + 54} width={68} height={24} rx={8} fill="none" stroke={GOLD} strokeOpacity={0.5} strokeWidth={1} />
            <path d={`M${cx - 28} ${loungeTop + 54}v-9a6 6 0 0 1 6-6h44a6 6 0 0 1 6 6v9`} fill="none" stroke={GOLD} strokeOpacity={0.5} strokeWidth={1} />
            {/* screen */}
            <path d={`M${cx - 30} ${loungeTop + 18}h60`} stroke={GOLD} strokeOpacity={0.6} strokeWidth={2} />
            <text x={x0 + 12} y={y1 - 12} fill={GOLD_2} style={label}>
              {FLOOR_PLAN_LABELS.suite(s + 1).toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* lanes */}
      {Array.from({ length: count }).map((_, i) => {
        const x = laneX(i);
        const isSuite = i >= suiteStart;
        return (
          <g key={i}>
            <rect x={x} y={laneTop} width={laneW} height={laneH} rx={6} fill={isSuite ? "none" : "#2c2c30"} stroke={HAIR_DARK} strokeWidth={1} />
            {/* target carrier */}
            <path d={`M${x + laneW * 0.22} ${laneTop + 22}h${laneW * 0.56}`} stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
            <path d={`M${x + laneW / 2} ${laneTop + 22}v40`} stroke={HAIR_DARK} strokeWidth={1} />
            <text x={x + laneW / 2} y={laneTop + laneH - 14} fill="#a1a1a6" textAnchor="middle" style={label}>
              {String(i + 1).padStart(2, "0")}
            </text>
          </g>
        );
      })}

      {/* firing line */}
      <path d={`M${pad} ${fireY}H${W - pad}`} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <text x={pad} y={fireY + 16} fill="rgba(161,161,166,0.8)" style={label}>
        {FLOOR_PLAN_LABELS.firingLine.toUpperCase()}
      </text>

      {/* public lounge and desk */}
      <rect x={pad} y={loungeTop} width={laneX(suiteStart - 1) + laneW - pad} height={loungeH} rx={10} fill="none" stroke={HAIR_DARK} strokeWidth={1} />
      <text x={pad + 12} y={loungeTop + loungeH - 12} fill="rgba(161,161,166,0.8)" style={label}>
        {FLOOR_PLAN_LABELS.lounge.toUpperCase()}
      </text>
      {/* lounge tables */}
      {[0.22, 0.42, 0.62].map((f) => {
        const cx = pad + (laneX(suiteStart - 1) + laneW - pad) * f;
        return <circle key={f} cx={cx} cy={loungeTop + 62} r={14} fill="none" stroke={HAIR_DARK} strokeWidth={1} />;
      })}
      {/* desk */}
      <rect x={laneX(suiteStart - 1) + laneW - 120} y={loungeTop + 40} width={96} height={22} rx={4} fill="none" stroke={HAIR_DARK} strokeWidth={1} />
      <text x={laneX(suiteStart - 1) + laneW - 72} y={loungeTop + 84} fill="rgba(161,161,166,0.8)" textAnchor="middle" style={label}>
        {FLOOR_PLAN_LABELS.desk.toUpperCase()}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------------
   Date night: two target rings overlapping like a Venn diagram, the
   intersection filled gold at 12%, an espresso cup at the center.
   Sits inside the DATE_PHOTO_01 slot at 3:2.
   --------------------------------------------------------------------- */
export function DateNightArt({ className }: { className?: string }) {
  const r = 128;
  const cy = 200;
  const c1 = 236;
  const c2 = 364;
  const cx = (c1 + c2) / 2;
  return (
    <div className={cn("absolute inset-0 bg-[linear-gradient(160deg,#1d1d1f_0%,#0a0a0b_60%,#000_100%)]", className)}>
      <svg viewBox="0 0 600 400" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <clipPath id="dn-left">
            <circle cx={c1} cy={cy} r={r} />
          </clipPath>
        </defs>
        {/* intersection: the one gold element */}
        <circle cx={c2} cy={cy} r={r} fill={GOLD} fillOpacity={0.12} clipPath="url(#dn-left)" />
        {/* rings */}
        {[c1, c2].map((c) => (
          <g key={c}>
            <circle cx={c} cy={cy} r={r} fill="none" stroke="rgba(245,245,247,0.32)" strokeWidth={1} pathLength={1} className="draw" />
            <circle cx={c} cy={cy} r={r * 0.66} fill="none" stroke={HAIR_DARK} strokeWidth={1} pathLength={1} className="draw" style={{ transitionDelay: "0.2s" }} />
            <circle cx={c} cy={cy} r={r * 0.33} fill="none" stroke={HAIR_DARK} strokeWidth={1} pathLength={1} className="draw" style={{ transitionDelay: "0.35s" }} />
          </g>
        ))}
        {/* espresso cup at the center of the intersection */}
        <g fill="none" stroke="rgba(245,245,247,0.75)" strokeWidth={1.2} strokeLinecap="round">
          <path d={`M${cx - 15} ${cy - 4}h30v13a10 10 0 0 1-10 10h-10a10 10 0 0 1-10-10z`} />
          <path d={`M${cx + 15} ${cy}h5a6 6 0 0 1 0 12h-5`} />
          <path d={`M${cx - 21} ${cy + 26}h42`} />
          <path d={`M${cx - 5} ${cy - 20}c0 -4 3 -4 3 -8M${cx + 3} ${cy - 20}c0 -4 3 -4 3 -8`} strokeOpacity={0.5} />
        </g>
        {/* mono captions */}
        <text x={c1 - r} y={cy + r + 28} fill="rgba(161,161,166,0.8)" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em" }}>
          SIMULATOR
        </text>
        <text x={c2 + r} y={cy + r + 28} fill="rgba(161,161,166,0.8)" textAnchor="end" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em" }}>
          RIFLE
        </text>
        <text x={cx} y={cy - r - 14} fill="rgba(161,161,166,0.8)" textAnchor="middle" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em" }}>
          LOUNGE
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------------
   Parties: twelve hairline avatar outlines, the first six in gold.
   --------------------------------------------------------------------- */
function Avatar({ gold }: { gold: boolean }) {
  return (
    <svg viewBox="0 0 40 44" className="h-auto w-full" aria-hidden="true">
      <circle cx="20" cy="13" r="9" fill="none" stroke={gold ? GOLD : HAIR_LIGHT} strokeWidth={gold ? 1.4 : 1} />
      <path d="M5 43a15 15 0 0 1 30 0" fill="none" stroke={gold ? GOLD : HAIR_LIGHT} strokeWidth={gold ? 1.4 : 1} strokeLinecap="round" />
    </svg>
  );
}

export function AvatarRow({ className }: { className?: string }) {
  return (
    <figure className={cn("w-full", className)}>
      <div className="grid grid-cols-6 gap-3 sm:gap-4" role="img" aria-label={`${AVATARS.total} guests, ${AVATARS.caption}`}>
        {Array.from({ length: AVATARS.total }).map((_, i) => (
          <Avatar key={i} gold={i < AVATARS.gold} />
        ))}
      </div>
      <figcaption className="mt-5 flex items-center justify-between font-mono text-[0.75rem] uppercase tracking-[0.08em] text-ink-muted">
        <span>{AVATARS.caption}</span>
        <span className="tabular">{`${AVATARS.gold} / ${AVATARS.total}`}</span>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------------
   Corporate: an eight-team bracket in hairlines with the winning path in gold.
   Wrap in <InView> so the gold path draws in over 900ms.
   --------------------------------------------------------------------- */
export function Bracket({ className }: { className?: string }) {
  const slotY = (i: number) => 40 + i * 46;
  const x = { label: 118, r1: 128, r2: 192, r3: 256, final: 320, winner: 336 };
  const m1 = [0, 1, 2, 3].map((k) => (slotY(2 * k) + slotY(2 * k + 1)) / 2);
  const m2 = [0, 1].map((j) => (m1[2 * j] + m1[2 * j + 1]) / 2);
  const m3 = (m2[0] + m2[1]) / 2;
  const mono = { fontFamily: MONO, fontSize: 12 } as const;
  const roundStyle = { fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em" } as const;

  const lines: string[] = [];
  for (let i = 0; i < 8; i++) lines.push(`M${x.r1} ${slotY(i)}H${x.r2}`);
  for (let k = 0; k < 4; k++) {
    lines.push(`M${x.r2} ${slotY(2 * k)}V${slotY(2 * k + 1)}`);
    lines.push(`M${x.r2} ${m1[k]}H${x.r3}`);
  }
  for (let j = 0; j < 2; j++) {
    lines.push(`M${x.r3} ${m1[2 * j]}V${m1[2 * j + 1]}`);
    lines.push(`M${x.r3} ${m2[j]}H${x.final}`);
  }
  lines.push(`M${x.final} ${m2[0]}V${m2[1]}`);
  lines.push(`M${x.final} ${m3}H${x.winner}`);

  const winning = `M${x.r1} ${slotY(0)}H${x.r2}V${m1[0]}H${x.r3}V${m2[0]}H${x.final}V${m3}H${x.winner}`;

  return (
    <svg viewBox="0 0 420 380" className={cn("block h-auto w-full", className)} aria-hidden="true">
      {/* round labels, centred over each column so "Round of 8" cannot run into "Semis" */}
      <text x={(x.r1 + x.r2) / 2} y={18} fill="rgba(161,161,166,0.7)" textAnchor="middle" style={roundStyle}>
        {BRACKET_ROUNDS[0].toUpperCase()}
      </text>
      <text x={(x.r2 + x.r3) / 2} y={18} fill="rgba(161,161,166,0.7)" textAnchor="middle" style={roundStyle}>
        {BRACKET_ROUNDS[1].toUpperCase()}
      </text>
      <text x={(x.r3 + x.final) / 2} y={18} fill="rgba(161,161,166,0.7)" textAnchor="middle" style={roundStyle}>
        {BRACKET_ROUNDS[2].toUpperCase()}
      </text>
      {/* team labels */}
      {BRACKET_TEAMS.map((t, i) => (
        <text key={t} x={x.label} y={slotY(i) + 4} fill={i === 0 ? GOLD_2 : "#a1a1a6"} textAnchor="end" style={mono}>
          {t}
        </text>
      ))}
      {/* hairline structure */}
      <path d={lines.join("")} fill="none" stroke={HAIR_DARK} strokeWidth={1} />
      {/* winning path: draws in */}
      <path d={winning} fill="none" stroke={GOLD} strokeWidth={1.5} strokeLinejoin="round" pathLength={1} className="draw" />
      <circle cx={x.winner} cy={m3} r={3.5} fill={GOLD} />
      <text x={x.winner + 10} y={m3 - 6} fill="rgba(161,161,166,0.7)" style={roundStyle}>
        {BRACKET_WINNER_LABEL.toUpperCase()}
      </text>
      <text x={x.winner + 10} y={m3 + 10} fill={GOLD_2} style={mono}>
        {BRACKET_TEAMS[0]}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------------
   Client logo strip placeholder: six muted marks in hairline frames.
   --------------------------------------------------------------------- */
export function LogoStripArt() {
  const marks = [
    <circle key="a" cx="20" cy="20" r="9" />,
    <rect key="b" x="11" y="11" width="18" height="18" rx="3" />,
    <path key="c" d="M20 9l11 20H9z" strokeLinejoin="round" />,
    <path key="d" d="M10 20h20M20 10v20" />,
    <path key="e" d="M11 20a9 9 0 0 1 18 0M11 20a9 9 0 0 0 18 0" />,
    <rect key="f" x="10" y="14" width="20" height="12" rx="6" />,
  ];
  return (
    <div className="absolute inset-0 grid grid-cols-3 gap-3 sm:grid-cols-6">
      {marks.map((m, i) => (
        <div key={i} className="flex items-center justify-center gap-2 rounded-xl ring-1 ring-inset ring-white/10">
          <svg viewBox="0 0 40 40" className="h-7 w-7 shrink-0" fill="none" stroke="rgba(161,161,166,0.6)" strokeWidth="1.2" aria-hidden="true">
            {m}
          </svg>
          <span aria-hidden="true" className="hidden h-1.5 w-10 rounded-full bg-white/10 sm:block" />
        </div>
      ))}
    </div>
  );
}
