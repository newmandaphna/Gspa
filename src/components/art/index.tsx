import { cn } from "@/lib/cn";

/**
 * Photography-free visuals. Every piece is pure SVG/CSS so the site looks
 * finished before real imagery exists. Each accepts className for sizing.
 */

/** Concentric target rings with a soft glow. Works on light or dark. */
export function TargetRings({ className, tone = "dark", rings = 6, animate = true }: { className?: string; tone?: "dark" | "light"; rings?: number; animate?: boolean }) {
  const stroke = tone === "dark" ? "rgba(255,255,255,0.22)" : "rgba(29,29,31,0.16)";
  const center = tone === "dark" ? "#e2c98a" : "#8f7134";
  return (
    <svg viewBox="0 0 400 400" className={cn("h-full w-full", className)} aria-hidden="true">
      <defs>
        <radialGradient id="tr-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={center} stopOpacity={tone === "dark" ? 0.35 : 0.18} />
          <stop offset="60%" stopColor={center} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="200" fill="url(#tr-glow)" />
      {Array.from({ length: rings }).map((_, i) => {
        const r = 30 + (i * 160) / (rings - 1);
        return (
          <circle
            key={i}
            cx="200"
            cy="200"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={i === rings - 1 ? 1 : 1.2}
            className={animate ? "origin-center" : undefined}
            style={animate ? { animation: `tr-pulse 6s ${i * 0.35}s ease-in-out infinite` } : undefined}
          />
        );
      })}
      <circle cx="200" cy="200" r="7" fill={center} />
      <path d="M200 10v22M200 368v22M10 200h22M368 200h22" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <style>{`@keyframes tr-pulse{0%,100%{opacity:.55}50%{opacity:1}}`}</style>
    </svg>
  );
}

/** A lane receding into darkness: converging light rails and a lit target frame. */
export function LanePerspective({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className={cn("h-full w-full", className)} aria-hidden="true">
      <defs>
        <linearGradient id="lp-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#141416" />
        </linearGradient>
        <linearGradient id="lp-rail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e2c98a" stopOpacity="0" />
          <stop offset="0.5" stopColor="#e2c98a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#e2c98a" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lp-target" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#e2c98a" stopOpacity="0.25" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lp-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#lp-floor)" />
      {/* vanishing-point glow */}
      <circle cx="800" cy="430" r="260" fill="url(#lp-target)" />
      {/* floor rails */}
      {[-520, -380, -240, -110, 0, 110, 240, 380, 520].map((x, i) => (
        <line key={i} x1={800 + x * 2.2} y1="900" x2={800 + x * 0.12} y2="440" stroke="rgba(255,255,255,0.10)" strokeWidth={Math.abs(x) < 130 ? 1.2 : 0.8} />
      ))}
      {/* ceiling rails */}
      {[-520, -260, 0, 260, 520].map((x, i) => (
        <line key={`c${i}`} x1={800 + x * 2.2} y1="0" x2={800 + x * 0.12} y2="420" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
      ))}
      {/* horizontal depth bands */}
      {[900, 760, 660, 590, 540, 505, 480, 462].map((y, i) => (
        <line key={`h${i}`} x1={800 - (y - 430) * 2.4} y1={y} x2={800 + (y - 430) * 2.4} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
      ))}
      {/* lit rails on the lane edges */}
      <path d="M470 900 L790 445" stroke="url(#lp-rail)" strokeWidth="2" />
      <path d="M1130 900 L810 445" stroke="url(#lp-rail)" strokeWidth="2" />
      {/* target frame */}
      <rect x="770" y="400" width="60" height="70" rx="2" fill="#0a0a0b" stroke="rgba(226,201,138,0.7)" strokeWidth="1.2" />
      <circle cx="800" cy="435" r="16" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
      <circle cx="800" cy="435" r="8" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
      <circle cx="800" cy="435" r="2.5" fill="#e2c98a" />
      <rect width="1600" height="900" fill="url(#lp-fade)" opacity="0.35" />
    </svg>
  );
}

/** Soft accent/white glows for dark bands. Absolutely positioned; parent must be relative + overflow-hidden. */
export function Glow({ className, variant = "accent" }: { className?: string; variant?: "accent" | "white" | "cool" }) {
  const color = variant === "accent" ? "rgba(226,201,138,0.28)" : variant === "cool" ? "rgba(41,151,255,0.22)" : "rgba(255,255,255,0.16)";
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute rounded-full blur-3xl", className)}
      style={{ background: `radial-gradient(closest-side, ${color}, transparent 70%)` }}
    />
  );
}

/** A "device-like" glossy panel — glass card with an inner highlight, for feature tiles. */
export function GlassPanel({ className, children, tone = "dark" }: { className?: string; children?: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card",
        tone === "dark"
          ? "bg-[linear-gradient(160deg,#2c2c2e_0%,#151516_60%,#0a0a0b_100%)] shadow-[var(--shadow-card-dark)] ring-1 ring-white/10"
          : "bg-[linear-gradient(160deg,#ffffff_0%,#f5f5f7_70%,#e8e8ed_100%)] shadow-[var(--shadow-card)] ring-1 ring-ink/5",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: tone === "dark" ? "linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)" : "linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent)" }}
      />
      {children}
    </div>
  );
}

/** Grid of 16 lane tiles that light up, for the "16 lanes" story. */
export function LaneGrid({ className, highlight = 4 }: { className?: string; highlight?: number }) {
  return (
    <div className={cn("grid grid-cols-8 gap-2", className)} aria-hidden="true">
      {Array.from({ length: 16 }).map((_, i) => {
        const premium = i >= 16 - highlight;
        return (
          <div
            key={i}
            className={cn(
              "aspect-[3/5] rounded-md ring-1",
              premium ? "bg-[linear-gradient(180deg,rgba(226,201,138,.55),rgba(226,201,138,.08))] ring-accent-2/40" : "bg-[linear-gradient(180deg,rgba(255,255,255,.22),rgba(255,255,255,.03))] ring-white/10",
            )}
            style={{ animation: `lg-breathe 5s ${i * 0.12}s ease-in-out infinite` }}
          />
        );
      })}
      <style>{`@keyframes lg-breathe{0%,100%{opacity:.75}50%{opacity:1}}`}</style>
    </div>
  );
}

/** Thin crosshair reticle used as a decorative mark. */
export function Reticle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-6 w-6", className)} aria-hidden="true">
      <circle cx="24" cy="24" r="16" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M24 2v10M24 36v10M2 24h10M36 24h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
