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


/**
 * Soft accent/white glow. Absolutely positioned; parent must be relative + overflow-hidden.
 * Reserved for the simulator band on the home page (SimArt); every other dark band sits flat.
 */
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

/** A "device-like" glossy panel: a glass card with an inner highlight, for feature tiles. */
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
