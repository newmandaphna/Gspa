import Link from "next/link";
import { cn } from "@/lib/cn";
import { FACILITY } from "@/lib/config/site";
import { Glow, TargetRings } from "@/components/art";
import { LaneScroller } from "@/components/LaneScroller";

/**
 * Home-page line art. Pure SVG/CSS, no images. Hairlines are 1px:
 * rgba(255,255,255,.12) on dark, #d2d2d7 on light. One accent element per piece.
 * Paths with the "draw" class animate in once a parent gets "in-view" (see InView.tsx).
 * The lanes plan is the page's one drawing of the room; the other slots are photo stand-ins.
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
   Every tile links into the reserve flow with its lane number; below sm the
   plan scrolls sideways at 72 px a lane (LaneScroller) instead of shrinking.
   --------------------------------------------------------------------- */
export function laneHref(n: number, experience = "lane-session"): string {
  return `/reserve?experience=${experience}&lane=${String(n).padStart(2, "0")}`;
}

export function FloorPlan({ laneLabel, className }: { laneLabel: (n: number) => string; className?: string }) {
  const count = FACILITY.laneCount;
  const lanes = Array.from({ length: count }, (_, i) => i + 1);
  return (
    <figure className={cn("relative", className)}>
      <div className="flex items-center justify-between font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-mist/80 sm:text-xs">
        <span>Target line · {FACILITY.laneYards} yd</span>
        <span className="tabular">{count} lanes</span>
      </div>
      <LaneScroller className="mt-3">
        <div
          className="grid grid-cols-[repeat(var(--lanes),72px)] gap-1.5 px-6 sm:grid-cols-[repeat(var(--lanes),minmax(0,1fr))] sm:gap-2.5 sm:px-0"
          style={{ "--lanes": count } as React.CSSProperties}
          role="list"
          aria-label={`${count} lanes, top-down plan`}
        >
          {lanes.map((n) => {
            const label = String(n).padStart(2, "0");
            return (
              <div
                key={n}
                role="listitem"
                data-lane={label}
                className="group relative aspect-[1/4] snap-start rounded-[6px] bg-white/[0.03] ring-1 ring-inset ring-white/12 transition-[background-color,box-shadow] duration-300 hover:bg-accent/[0.06] hover:ring-accent/70 focus-within:ring-accent/70 sm:aspect-[1/5] sm:rounded-lg"
              >
                {/* target carrier */}
                <span aria-hidden="true" className="absolute inset-x-[22%] top-[9%] h-px bg-white/25 transition-colors duration-300 group-hover:bg-accent" />
                <span aria-hidden="true" className="absolute left-1/2 top-[9%] h-[26%] w-px -translate-x-1/2 bg-white/10" />
                {/* lane number (a direct child span: LaneWalk colors it as you scroll) */}
                <span className="absolute inset-x-0 bottom-2 text-center font-mono text-[0.75rem] text-mist transition-colors duration-300 group-hover:text-accent-2 sm:bottom-3 sm:text-xs">
                  {label}
                </span>
                {/* the link covers the tile; the chip stays a sibling so hover on the link still lifts it */}
                <Link href={laneHref(n)} aria-label={`Reserve lane ${label}`} className="absolute inset-0 rounded-[6px] sm:rounded-lg" />
                {/* hover chip */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute -top-10 z-10 whitespace-nowrap rounded-pill bg-night-3 px-2.5 py-1 font-mono text-[0.6875rem] text-snow opacity-0 ring-1 ring-white/10 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100",
                    n <= count / 2 ? "left-0" : "right-0",
                  )}
                >
                  {laneLabel(n)}
                </span>
              </div>
            );
          })}
        </div>
      </LaneScroller>
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
        <li key={label} className="flex flex-col items-center px-0.5 text-center">
          <span
            aria-hidden="true"
            className="block h-[15px] w-[15px] scale-50 rounded-full bg-paper ring-1 ring-inset ring-hairline transition-[transform,background-color,box-shadow] duration-500 ease-[var(--ease-apple)] [.in-view_&]:scale-100 [.in-view_&]:bg-accent [.in-view_&]:ring-accent"
            style={{ transitionDelay: `${0.25 + i * 0.22}s` }}
          />
          {/* On phones the number stacks above the word and the tracking tightens so five labels fit in ~70px columns. */}
          <span className="t-eyebrow mt-4 text-[0.5625rem] tracking-[0.1em] text-ink-muted sm:text-[0.75rem] sm:tracking-[0.16em]">
            <span className="block font-mono normal-case tracking-normal text-ink-faint sm:inline">{String(i + 1).padStart(2, "0")} </span>
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Art for the LOUNGE_PHOTO_01 slot: a dark room with a soft gold glow and a hairline table line. */
export function LoungeArt() {
  return (
    <Placeholder tone="dark">
      {/* one lamp over the table, drawn as a static gradient (no Glow outside the simulator band) */}
      <div aria-hidden="true" className="absolute left-[10%] top-[30%] h-[70%] w-[60%] rounded-full opacity-60" style={{ background: "radial-gradient(closest-side, rgba(226,201,138,0.22), transparent 70%)" }} />
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
