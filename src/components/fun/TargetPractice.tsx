"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/config/site";

/**
 * Five shots at a paper target. The sight picture breathes (a slow figure-eight
 * wobble, like a real hold), each shot lands where the reticle was when you
 * pressed, a hole is torn in the paper, a spent case flies out to the right,
 * and the card keeps score: ring value, total out of 50, and group size in
 * inches, the number shooters actually compare.
 *
 * Keyboard: focus the target, arrows move the reticle, Space or Enter fires.
 * Reduced motion: no wobble, no ejection, no recoil; the game still works.
 */

const SHOTS = 5;
/** Target geometry in inches. The paper is 12 by 12; rings are the club's own. */
const PAPER = 12;
const RINGS = [
  { score: 10, r: 0.8 },
  { score: 9, r: 1.6 },
  { score: 8, r: 2.5 },
  { score: 7, r: 3.4 },
  { score: 6, r: 4.4 },
  { score: 5, r: 5.4 },
] as const;
const BULL = 3.4; // rings 7 to 10 are printed black
const HOLE = 0.355; // 9 mm

type Shot = { x: number; y: number; score: number; id: number };

function scoreAt(x: number, y: number): number {
  const d = Math.hypot(x, y) - HOLE / 2; // a hole touching a ring line scores the higher ring
  for (const ring of RINGS) if (d <= ring.r) return ring.score;
  return 0;
}

function groupSize(shots: Shot[]): number {
  let max = 0;
  for (let i = 0; i < shots.length; i++)
    for (let j = i + 1; j < shots.length; j++) max = Math.max(max, Math.hypot(shots[i].x - shots[j].x, shots[i].y - shots[j].y));
  return shots.length > 1 ? max + HOLE : 0;
}

/** Ragged outline for a torn hole; deterministic per seed so a re-render never reshapes it. */
function tornOutline(x: number, y: number, seed: number): string {
  const n = 11;
  const out: string[] = [];
  for (let i = 0, s = seed * 9301 + 49297; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const a = (i / n) * Math.PI * 2;
    const rr = (HOLE / 2) * (0.82 + (s / 233280) * 0.34);
    out.push(`${(x + Math.cos(a) * rr).toFixed(3)},${(y + Math.sin(a) * rr).toFixed(3)}`);
  }
  return out.join(" ");
}

/** A torn 9 mm hole: dark center, ragged paper edge, a faint gray lead ring. */
function Hole({ x, y, seed }: { x: number; y: number; seed: number }) {
  const pts = useMemo(() => tornOutline(x, y, seed), [x, y, seed]);
  return (
    <g className="tp-hole">
      <circle cx={x} cy={y} r={HOLE * 0.72} fill="rgba(60,55,48,0.18)" />
      <polygon points={pts} fill="#16130f" stroke="#e9e2d2" strokeWidth={0.02} />
      <circle cx={x - 0.03} cy={y - 0.03} r={HOLE * 0.28} fill="#050404" />
    </g>
  );
}

export function TargetPractice({ ctaHref = "/reserve?type=lane", className }: { ctaHref?: string; className?: string }) {
  const titleId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [aim, setAim] = useState<{ x: number; y: number } | null>(null);
  const [wobble, setWobble] = useState({ x: 0, y: 0 });
  const [recoil, setRecoil] = useState(0);
  const [ejects, setEjects] = useState<number[]>([]);
  const [best, setBest] = useState<number | null>(null);
  const [live, setLive] = useState("");
  const reduced = useRef(false);
  const nextId = useRef(1);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      const b = window.localStorage.getItem("gs-target-best");
      if (b) queueMicrotask(() => setBest(Number(b)));
    } catch {
      /* storage unavailable */
    }
  }, []);

  // The breathing hold: a slow Lissajous drift, about a quarter inch at 25 yards.
  useEffect(() => {
    if (reduced.current) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      setWobble({ x: Math.sin(t * 1.3) * 0.32 + Math.sin(t * 3.1) * 0.06, y: Math.sin(t * 0.9 + 1) * 0.26 + Math.cos(t * 2.3) * 0.05 });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const done = shots.length >= SHOTS;
  const total = shots.reduce((n, s) => n + s.score, 0);
  const group = groupSize(shots);

  const toTarget = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width - 0.5) * PAPER, y: ((clientY - r.top) / r.height - 0.5) * PAPER };
  }, []);

  const fire = useCallback(
    (at: { x: number; y: number }) => {
      if (done) return;
      const x = Math.max(-PAPER / 2 + 0.2, Math.min(PAPER / 2 - 0.2, at.x + wobble.x));
      const y = Math.max(-PAPER / 2 + 0.2, Math.min(PAPER / 2 - 0.2, at.y + wobble.y));
      const score = scoreAt(x, y);
      const id = nextId.current++;
      const next = [...shots, { x, y, score, id }];
      setShots(next);
      setLive(`Shot ${next.length}: ${score === 0 ? "off the scoring rings" : `${score}`}.${next.length === SHOTS ? ` Final score ${next.reduce((n, s) => n + s.score, 0)} of 50.` : ""}`);
      if (!reduced.current) {
        setRecoil((r) => r + 1);
        setEjects((e) => [...e.slice(-4), id]);
      }
      if (next.length === SHOTS) {
        const final = next.reduce((n, s) => n + s.score, 0);
        if (best === null || final > best) {
          setBest(final);
          try {
            window.localStorage.setItem("gs-target-best", String(final));
          } catch {
            /* storage unavailable */
          }
        }
      }
    },
    [done, shots, wobble, best],
  );

  const reset = () => {
    setShots([]);
    setLive("New target hung. Five shots.");
  };

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.4;
    const cur = aim ?? { x: 0, y: 0 };
    const move: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (move[e.key]) {
      e.preventDefault();
      setAim({ x: Math.max(-5.8, Math.min(5.8, cur.x + move[e.key][0])), y: Math.max(-5.8, Math.min(5.8, cur.y + move[e.key][1])) });
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      fire(cur);
    }
  };

  const reticle = aim ? { x: aim.x + wobble.x, y: aim.y + wobble.y } : null;
  const last = shots[shots.length - 1];

  return (
    <div className={cn("grid items-center gap-10 lg:grid-cols-12 lg:gap-14", className)}>
      {/* Scorecard */}
      <div className="order-2 lg:order-1 lg:col-span-5">
        <p className="t-eyebrow text-ink-muted">25 yards · 9 mm · five rounds</p>
        <h2 id={titleId} className="t-1 mt-5">
          Five shots.
          <br />
          <span className="t-accent">Show us your group.</span>
        </h2>
        <p className="t-body-lg mt-6 max-w-[30em] text-ink-muted">
          Hold the reticle on the black and squeeze. The sight moves the way yours will, a little, all the time. Tap the paper or use the arrow keys and Space.
        </p>

        <dl className="mt-10 grid grid-cols-3 border-y border-hairline">
          {[
            { k: "Shots", v: `${shots.length}/${SHOTS}` },
            { k: "Score", v: String(total) },
            { k: "Group", v: shots.length > 1 ? `${group.toFixed(1)}″` : "–" },
          ].map((s, i) => (
            <div key={s.k} className={cn("py-5", i > 0 && "border-l border-hairline pl-5")}>
              <dt className="t-label text-ink-muted">{s.k}</dt>
              <dd className="t-stencil mt-2 text-[3.25rem] leading-none">{s.v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 h-5 font-mono text-[0.75rem] tracking-[0.06em] text-ink-muted" aria-hidden="true">
          {last ? (last.score ? `Last shot: ${last.score}` : "Last shot: off the rings") : best !== null ? `Your best here: ${best} of 50` : "Paper is up."}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {done ? (
            <>
              <Button href={ctaHref} size="lg">
                Do it with real brass
              </Button>
              <Button variant="secondary" size="lg" onClick={reset}>
                Hang a new target
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={reset} disabled={!shots.length}>
              Hang a new target
            </Button>
          )}
        </div>
        {done && (
          <p className="t-subhead mt-6 text-ink-muted">
            {group < 2 ? "That group would make the wall in the lounge." : group < 4 ? "Respectable. An instructor would have you under two inches by lunch." : "The First Session exists for exactly this."}
          </p>
        )}
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>

      {/* The target on its carrier */}
      <div className="order-1 lg:order-2 lg:col-span-7">
        <div className="relative mx-auto w-full max-w-[560px]">
          {/* Carrier arm and clips */}
          <div className="absolute -top-6 left-1/2 h-6 w-[62%] -translate-x-1/2 rounded-t-[2px] bg-gradient-to-b from-[#2a2724] to-[#141210] shadow-[0_2px_0_rgba(0,0,0,0.25)]" aria-hidden="true">
            <span className="absolute -bottom-3 left-[12%] h-5 w-7 rounded-[2px] bg-gradient-to-b from-[#3a3632] to-[#1b1916]" />
            <span className="absolute -bottom-3 right-[12%] h-5 w-7 rounded-[2px] bg-gradient-to-b from-[#3a3632] to-[#1b1916]" />
          </div>
          <div
            key={recoil}
            className={cn("relative origin-top", recoil > 0 && "motion-safe:animate-[tp-recoil_420ms_var(--ease-snap)]")}
          >
            <svg
              ref={svgRef}
              viewBox={`${-PAPER / 2} ${-PAPER / 2} ${PAPER} ${PAPER}`}
              role="application"
              aria-labelledby={titleId}
              aria-describedby={`${titleId}-help`}
              tabIndex={0}
              onKeyDown={onKey}
              onFocus={() => !aim && setAim({ x: 0, y: 0 })}
              onPointerMove={(e) => {
                if (e.pointerType === "mouse") setAim(toTarget(e.clientX, e.clientY));
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") setAim(null);
              }}
              onPointerDown={(e) => {
                const at = toTarget(e.clientX, e.clientY);
                if (at) {
                  setAim(at);
                  fire(at);
                }
              }}
              className={cn(
                "block aspect-square w-full touch-manipulation select-none shadow-[0_30px_60px_-30px_rgba(20,18,16,0.55),0_2px_0_rgba(20,18,16,0.08)] outline-offset-8",
                done ? "cursor-default" : "cursor-none",
              )}
            >
              <defs>
                <filter id={`${titleId}-paper`} x="0" y="0" width="100%" height="100%">
                  <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="3" seed="4" result="n" />
                  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.24  0 0 0 0.06 0" />
                  <feComposite in2="SourceGraphic" operator="in" />
                </filter>
                <radialGradient id={`${titleId}-curl`} cx="50%" cy="50%" r="75%">
                  <stop offset="70%" stopColor="rgba(0,0,0,0)" />
                  <stop offset="100%" stopColor="rgba(60,48,30,0.12)" />
                </radialGradient>
              </defs>
              {/* Paper */}
              <rect x={-PAPER / 2} y={-PAPER / 2} width={PAPER} height={PAPER} fill="#f6f1e6" />
              <rect x={-PAPER / 2} y={-PAPER / 2} width={PAPER} height={PAPER} filter={`url(#${titleId}-paper)`} fill="#f6f1e6" />
              <rect x={-PAPER / 2} y={-PAPER / 2} width={PAPER} height={PAPER} fill={`url(#${titleId}-curl)`} />
              {/* Rings */}
              {[...RINGS].reverse().map((ring) => (
                <circle
                  key={ring.score}
                  r={ring.r}
                  fill={ring.r <= BULL ? "#14110e" : "none"}
                  stroke={ring.r <= BULL ? "#f6f1e6" : "#14110e"}
                  strokeWidth={ring.r <= BULL ? 0.028 : 0.04}
                />
              ))}
              <circle r={0.3} fill="none" stroke="#f6f1e6" strokeWidth={0.02} />
              {/* Ring numbers, printed on the horizontal and vertical like a real target */}
              {RINGS.slice(1).map((ring, i) => {
                const prev = RINGS[i].r;
                const mid = (ring.r + prev) / 2;
                const fill = ring.r <= BULL ? "#f6f1e6" : "#14110e";
                return (
                  <g key={ring.score} fill={fill} fontSize={0.34} fontFamily="var(--font-stencil)" fontWeight={800} textAnchor="middle" dominantBaseline="central">
                    <text x={mid} y={0}>{ring.score}</text>
                    <text x={-mid} y={0}>{ring.score}</text>
                    <text x={0} y={-mid}>{ring.score}</text>
                    <text x={0} y={mid}>{ring.score}</text>
                  </g>
                );
              })}
              {/* Printer's line */}
              <text x={-PAPER / 2 + 0.5} y={PAPER / 2 - 0.45} fontSize={0.26} fontFamily="var(--font-mono)" fill="#6b6358" letterSpacing={0.04}>
                GUN SPA · 25 YD PISTOL · NO. 07
              </text>
              <text x={PAPER / 2 - 0.5} y={PAPER / 2 - 0.45} fontSize={0.26} fontFamily="var(--font-mono)" fill="#6b6358" textAnchor="end">
                {SITE.address.public ? SITE.address.line1.toUpperCase() : "QUEENS, NY"}
              </text>
              {/* Holes */}
              {shots.map((s) => (
                <Hole key={s.id} x={s.x} y={s.y} seed={s.id} />
              ))}
              {/* Group circle once there are two or more */}
              {shots.length > 1 && (() => {
                const cx = shots.reduce((n, s) => n + s.x, 0) / shots.length;
                const cy = shots.reduce((n, s) => n + s.y, 0) / shots.length;
                return <circle cx={cx} cy={cy} r={group / 2} fill="none" stroke="#c9a55a" strokeWidth={0.035} strokeDasharray="0.12 0.1" />;
              })()}
              {/* Reticle */}
              {reticle && !done && (
                <g transform={`translate(${reticle.x} ${reticle.y})`} pointerEvents="none">
                  <circle r={0.9} fill="none" stroke="#c9a55a" strokeWidth={0.05} />
                  <circle r={0.06} fill="#c9a55a" />
                  <path d="M-1.6 0H-1.05M1.05 0H1.6M0 -1.6V-1.05M0 1.05V1.6" stroke="#c9a55a" strokeWidth={0.05} />
                </g>
              )}
            </svg>
            <p id={`${titleId}-help`} className="sr-only">
              Arrow keys move the sight, Shift for fine moves, Space or Enter fires. Five shots per target.
            </p>
          </div>

          {/* Ejected brass */}
          {ejects.map((id) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={id}
              src="/renders/casing.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-[-4%] top-[42%] w-12 animate-[tp-eject_900ms_cubic-bezier(.2,.7,.4,1)_forwards]"
              onAnimationEnd={() => setEjects((e) => e.filter((x) => x !== id))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
