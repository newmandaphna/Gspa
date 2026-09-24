import { cn } from "@/lib/cn";
import { FACILITY } from "@/lib/config/site";
import { Glow, TargetRings } from "@/components/art";
import type { HospitalityIconKey } from "@/lib/content/pages/home";

/**
 * Home-page line art. Pure SVG/CSS, no images. Hairlines are 1px:
 * rgba(255,255,255,.12) on dark, #d2d2d7 on light. One accent element per piece.
 * Paths with the "draw" class animate in once a parent gets "in-view" (see InView.tsx).
 */

const HAIR_DARK = "rgba(255,255,255,0.12)";
const HAIR_LIGHT = "#d2d2d7";
const GOLD = "#c9a55a";

/** Gradient stand-in for a photo. Looks finished until the real image arrives. */
export function Placeholder({ tone = "dark", className, children }: { tone?: "dark" | "light"; className?: string; children?: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 overflow-hidden",
        tone === "dark" ? "bg-[linear-gradient(160deg,#1d1d1f_0%,#0a0a0b_60%,#000_100%)]" : "bg-[linear-gradient(160deg,#f5f5f7_0%,#e8e8ed_100%)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------
   Quiet: a waveform that settles. Jagged at left, flat at right, gold tail.
   --------------------------------------------------------------------- */
export function Waveform({ className }: { className?: string }) {
  const pts: string[] = [];
  const n = 64;
  for (let i = 0; i <= n; i++) {
    const x = (i * 880) / n;
    const t = i / n;
    const amp = 64 * Math.pow(1 - t, 2.4);
    const scale = i % 3 === 0 ? 0.55 : i % 5 === 0 ? 0.8 : 1;
    const y = 80 + (i % 2 ? amp : -amp) * scale;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const jagged = `M${pts.join(" L")} L980,80`;
  return (
    <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className={cn("block h-24 w-full sm:h-40", className)} aria-hidden="true">
      <path d={jagged} fill="none" stroke={HAIR_LIGHT} strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinejoin="round" pathLength={1} className="draw" />
      <path
        d="M980,80 L1200,80"
        fill="none"
        stroke={GOLD}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        pathLength={1}
        className="draw"
        style={{ transitionDelay: "0.8s", transitionDuration: "0.6s" }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------------
   Lanes: top-down floor plan, one tile per lane from FACILITY.laneCount.
   Hover a lane for a mono chip. The firing line is the one accent element.
   --------------------------------------------------------------------- */
export function FloorPlan({ laneLabel, className }: { laneLabel: (n: number) => string; className?: string }) {
  const count = FACILITY.laneCount;
  const lanes = Array.from({ length: count }, (_, i) => i + 1);
  return (
    <figure className={cn("relative", className)}>
      <div className="flex items-center justify-between font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-mist/80 sm:text-xs">
        <span>Target line · {FACILITY.laneYards} yd</span>
        <span className="tabular">{count} lanes</span>
      </div>
      <div className="mt-3 grid gap-1.5 sm:gap-2.5" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }} role="list" aria-label={`${count} lanes, top-down plan`}>
        {lanes.map((n) => (
          <div
            key={n}
            role="listitem"
            className="group relative aspect-[1/4] rounded-[6px] bg-white/[0.03] ring-1 ring-inset ring-white/12 transition-[background-color,box-shadow] duration-300 hover:bg-accent/[0.06] hover:ring-accent/70 sm:aspect-[1/5] sm:rounded-lg"
          >
            {/* target carrier */}
            <span aria-hidden="true" className="absolute inset-x-[22%] top-[9%] h-px bg-white/25 transition-colors duration-300 group-hover:bg-accent" />
            <span aria-hidden="true" className="absolute left-1/2 top-[9%] h-[26%] w-px -translate-x-1/2 bg-white/10" />
            {/* lane number */}
            <span className="absolute inset-x-0 bottom-2 text-center font-mono text-[0.625rem] text-mist transition-colors duration-300 group-hover:text-accent-2 sm:bottom-3 sm:text-xs">
              {String(n).padStart(2, "0")}
            </span>
            {/* hover chip */}
            <span
              className={cn(
                "pointer-events-none absolute -top-10 z-10 whitespace-nowrap rounded-pill bg-night-3 px-2.5 py-1 font-mono text-[0.6875rem] text-snow opacity-0 ring-1 ring-white/10 transition-opacity duration-200 group-hover:opacity-100",
                n <= count / 2 ? "left-0" : "right-0",
              )}
            >
              {laneLabel(n)}
            </span>
          </div>
        ))}
      </div>
      {/* firing line */}
      <div className="mt-3 h-px w-full bg-[linear-gradient(90deg,transparent,#c9a55a_12%,#c9a55a_88%,transparent)] opacity-80" aria-hidden="true" />
      <figcaption className="mt-3 flex items-center justify-between font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-mist/80 sm:text-xs">
        <span>Firing line</span>
        <span>Own air, every lane</span>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------------
   Suites: a minimal plan, two lanes and a lounge with a sofa. The host is the gold dot.
   --------------------------------------------------------------------- */
export function SuitePlan({ className }: { className?: string }) {
  const s = { fill: "none", stroke: HAIR_LIGHT, strokeWidth: 1.2, vectorEffect: "non-scaling-stroke" as const };
  return (
    <svg viewBox="0 0 420 260" className={cn("block h-auto w-full", className)} aria-hidden="true">
      {/* suite shell */}
      <rect x="20" y="20" width="380" height="220" rx="10" {...s} pathLength={1} className="draw" />
      {/* two lanes */}
      <rect x="40" y="40" width="70" height="180" rx="6" {...s} pathLength={1} className="draw" style={{ transitionDelay: "0.15s" }} />
      <rect x="126" y="40" width="70" height="180" rx="6" {...s} pathLength={1} className="draw" style={{ transitionDelay: "0.25s" }} />
      {/* targets */}
      <path d="M58 52h34M144 52h34" {...s} pathLength={1} className="draw" style={{ transitionDelay: "0.35s" }} />
      {/* frosted glass partition */}
      <path d="M216 40v180" {...s} strokeDasharray="3 5" pathLength={1} className="draw" style={{ transitionDelay: "0.4s" }} />
      {/* lounge: sofa */}
      <rect x="250" y="150" width="120" height="40" rx="12" {...s} pathLength={1} className="draw" style={{ transitionDelay: "0.5s" }} />
      <path d="M262 150v-14a8 8 0 0 1 8-8h80a8 8 0 0 1 8 8v14M262 190v10M358 190v10" {...s} pathLength={1} className="draw" style={{ transitionDelay: "0.55s" }} />
      {/* screen */}
      <path d="M262 62h96" {...s} strokeWidth={2.2} pathLength={1} className="draw" style={{ transitionDelay: "0.6s" }} />
      {/* espresso table */}
      <circle cx="310" cy="112" r="12" {...s} pathLength={1} className="draw" style={{ transitionDelay: "0.65s" }} />
      {/* door gap and the host outside it */}
      <path d="M330 240h40" stroke="#fbfbfd" strokeWidth="3" />
      <circle cx="350" cy="252" r="3.5" fill={GOLD} />
    </svg>
  );
}

/* ------------------------------------------------------------------------
   Simulator: scanlines, a gold laser trace that settles into a target ring,
   and mono corner labels. Sits over the SIM_PHOTO_01 slot.
   --------------------------------------------------------------------- */
export function SimulatorScreen({ labels }: { labels: { scenario: string; clock: string; bay: string; mode: string } }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 4px)" }}
      />
      <svg viewBox="0 0 2100 900" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        {/* faint frame grid */}
        <path d="M1050 0v900M0 450h2100" stroke={HAIR_DARK} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {/* laser trace */}
        <path
          d="M-20 840 C 420 700, 860 560, 1310 452"
          fill="none"
          stroke={GOLD}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          pathLength={1}
          className="draw"
        />
        <circle cx="1330" cy="447" r="46" fill="none" stroke={GOLD} strokeWidth="1" vectorEffect="non-scaling-stroke" pathLength={1} className="draw" style={{ transitionDelay: "0.7s" }} />
        <circle cx="1330" cy="447" r="18" fill="none" stroke={GOLD} strokeWidth="1" vectorEffect="non-scaling-stroke" pathLength={1} className="draw" style={{ transitionDelay: "0.9s" }} />
        <circle cx="1330" cy="447" r="4" fill={GOLD} />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-snow/70 sm:p-6 sm:text-xs" aria-hidden="true">
        <div className="flex justify-between">
          <span>{labels.scenario}</span>
          <span className="tabular">{labels.clock}</span>
        </div>
        <div className="flex justify-between">
          <span>{labels.bay}</span>
          <span>{labels.mode}</span>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------------
   First Session: five stops on a rail. Dots fill gold in sequence on reveal.
   --------------------------------------------------------------------- */
export function StepRail({ steps, className }: { steps: ReadonlyArray<string>; className?: string }) {
  return (
    <ol className={cn("relative grid", className)} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {/* rail */}
      <div aria-hidden="true" className="pointer-events-none absolute left-[10%] right-[10%] top-[7px] h-px bg-hairline" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[10%] top-[7px] h-px w-0 bg-accent transition-[width] duration-[1400ms] ease-[var(--ease-apple)] [.in-view_&]:w-[80%]"
        style={{ transitionDelay: "0.2s" }}
      />
      {steps.map((label, i) => (
        <li key={label} className="flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="block h-[15px] w-[15px] scale-50 rounded-full bg-paper ring-1 ring-inset ring-hairline transition-[transform,background-color,box-shadow] duration-500 ease-[var(--ease-apple)] [.in-view_&]:scale-100 [.in-view_&]:bg-accent [.in-view_&]:ring-accent"
            style={{ transitionDelay: `${0.25 + i * 0.22}s` }}
          />
          <span className="t-eyebrow mt-4 text-[0.625rem] text-ink-muted sm:text-[0.75rem]">
            <span className="font-mono normal-case tracking-normal text-ink-faint">{String(i + 1).padStart(2, "0")} </span>
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------------
   Hospitality: four hairline icons that draw in. The espresso steam is the gold dot.
   --------------------------------------------------------------------- */
export function HospitalityIcon({ icon, delay = 0, className }: { icon: HospitalityIconKey; delay?: number; className?: string }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, pathLength: 1 };
  const d = { transitionDelay: `${delay}s` };
  return (
    <svg viewBox="0 0 48 48" className={cn("h-12 w-12", className)} aria-hidden="true">
      {icon === "towel" && (
        <>
          <rect x="8" y="12" width="32" height="22" rx="3" {...s} className="draw" style={d} />
          <path d="M8 20h32M8 26h32" {...s} className="draw" style={{ transitionDelay: `${delay + 0.2}s` }} />
          <path d="M18 34v5M30 34v5" {...s} className="draw" style={{ transitionDelay: `${delay + 0.3}s` }} />
        </>
      )}
      {icon === "espresso" && (
        <>
          <path d="M10 18h22v10a8 8 0 0 1-8 8h-6a8 8 0 0 1-8-8z" {...s} className="draw" style={d} />
          <path d="M32 21h3a4 4 0 0 1 0 8h-3" {...s} className="draw" style={{ transitionDelay: `${delay + 0.2}s` }} />
          <path d="M8 41h30" {...s} className="draw" style={{ transitionDelay: `${delay + 0.3}s` }} />
          <circle cx="21" cy="10" r="1.8" fill={GOLD} />
        </>
      )}
      {icon === "locker" && (
        <>
          <rect x="14" y="6" width="20" height="36" rx="2" {...s} className="draw" style={d} />
          <path d="M19 12h10M19 16h10" {...s} className="draw" style={{ transitionDelay: `${delay + 0.2}s` }} />
          <circle cx="24" cy="30" r="3" {...s} className="draw" style={{ transitionDelay: `${delay + 0.3}s` }} />
          <path d="M24 33v4" {...s} className="draw" style={{ transitionDelay: `${delay + 0.35}s` }} />
        </>
      )}
      {icon === "brush" && (
        <>
          <circle cx="9" cy="39" r="2.5" {...s} className="draw" style={d} />
          <path d="M11 37L24 24" {...s} className="draw" style={{ transitionDelay: `${delay + 0.15}s` }} />
          <path d="M24 24L40 8" {...s} className="draw" style={{ transitionDelay: `${delay + 0.3}s` }} />
          <path d="M25 19l4 4M29 15l4 4M33 11l4 4M37 7l3 3" {...s} className="draw" style={{ transitionDelay: `${delay + 0.4}s` }} />
        </>
      )}
    </svg>
  );
}

/** Art for the LOUNGE_PHOTO_01 slot: a dark room with a soft gold glow and a hairline table line. */
export function LoungeArt() {
  return (
    <Placeholder tone="dark">
      <Glow variant="accent" className="left-[10%] top-[30%] h-[70%] w-[60%] opacity-60" />
      <div aria-hidden="true" className="absolute inset-x-[8%] bottom-[28%] h-px" style={{ background: HAIR_DARK }} />
      <div aria-hidden="true" className="absolute inset-x-[8%] bottom-[22%] h-px" style={{ background: HAIR_DARK }} />
      <div aria-hidden="true" className="absolute left-[8%] top-[12%] h-[52%] w-px" style={{ background: HAIR_DARK }} />
      <div aria-hidden="true" className="absolute right-[8%] top-[12%] h-[52%] w-px" style={{ background: HAIR_DARK }} />
    </Placeholder>
  );
}

/** Art for the SUITE_PHOTO_01 slot: light gradient with a frosted-glass band. */
export function SuiteArt() {
  return (
    <Placeholder tone="light">
      <div aria-hidden="true" className="absolute inset-y-0 left-[38%] w-px" style={{ background: HAIR_LIGHT }} />
      <div aria-hidden="true" className="absolute inset-y-0 right-0 left-[38%] bg-white/50" />
      <div aria-hidden="true" className="absolute inset-x-[6%] bottom-[18%] h-px" style={{ background: HAIR_LIGHT }} />
    </Placeholder>
  );
}

/** Art for the SIM_PHOTO_01 slot: near-black with a wide, dim glow at the target. */
export function SimArt() {
  return (
    <Placeholder tone="dark">
      <Glow variant="accent" className="left-[48%] top-[18%] h-[70%] w-[34%] opacity-30" />
    </Placeholder>
  );
}

/** Art for the EXTERIOR_PHOTO_01 slot: black, faint target rings low and left, like a lit sign at dusk. */
export function ExteriorArt() {
  return (
    <Placeholder tone="dark">
      <div className="absolute -left-[10%] top-[10%] h-[120%] w-[70%] opacity-40 lg:w-[50%]">
        <TargetRings tone="dark" rings={5} animate={false} />
      </div>
    </Placeholder>
  );
}

/* ------------------------------------------------------------------------
   Visit: three hairlines converging on a gold pin. Labels are HTML so they
   stay legible at phone width.
   --------------------------------------------------------------------- */
type Station = { x: number; y: number };
const PIN: Station = { x: 60, y: 50 };
const ROUTES: { label: string; from: Station; stops: Station[]; labelPos: string }[] = [
  { label: "Jamaica LIRR", from: { x: 4, y: 24 }, stops: [{ x: 20, y: 31 }, { x: 40, y: 40 }], labelPos: "left-[4%] top-[24%] -translate-y-[calc(100%+10px)]" },
  { label: "Sutphin Blvd–Archer Av", from: { x: 4, y: 82 }, stops: [{ x: 22, y: 72 }, { x: 42, y: 60 }], labelPos: "left-[4%] top-[82%] translate-y-[10px]" },
  { label: "AirTrain JFK", from: { x: 96, y: 90 }, stops: [{ x: 84, y: 77 }, { x: 72, y: 63 }], labelPos: "right-[4%] top-[90%] translate-y-[10px]" },
];

export function TransitSketch({ stations, pin, className }: { stations: ReadonlyArray<string>; pin: string; className?: string }) {
  const routes = ROUTES.map((r, i) => ({ ...r, label: stations[i] ?? r.label }));
  return (
    <div className={cn("relative aspect-[4/3] w-full sm:aspect-[16/10]", className)} aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {routes.map((r, i) => (
          <path
            key={r.label}
            d={`M${r.from.x} ${r.from.y} L${PIN.x} ${PIN.y}`}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            className="draw"
            style={{ transitionDelay: `${i * 0.2}s` }}
          />
        ))}
      </svg>
      {routes.flatMap((r) =>
        r.stops.map((s, j) => (
          <span
            key={`${r.label}-${j}`}
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-night ring-1 ring-white/50"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          />
        )),
      )}
      {routes.map((r) => (
        <span
          key={r.label}
          className={cn("absolute whitespace-nowrap font-mono text-[0.6875rem] text-snow/75 sm:text-xs", r.labelPos)}
        >
          {r.label}
        </span>
      ))}
      {/* the pin */}
      <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${PIN.x}%`, top: `${PIN.y}%` }}>
        <span className="block h-4 w-4 rounded-full bg-accent shadow-[0_0_0_6px_rgba(201,165,90,0.18)]" />
      </span>
      <span
        className="absolute -translate-y-1/2 whitespace-nowrap pl-4 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-accent-2 sm:text-xs"
        style={{ left: `${PIN.x + 2}%`, top: `${PIN.y}%` }}
      >
        {pin}
      </span>
    </div>
  );
}
