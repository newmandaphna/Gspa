import { cn } from "@/lib/cn";

/**
 * Photography-free visuals. Every piece is pure SVG/CSS so the site looks
 * finished before real imagery exists. Each accepts className for sizing.
 */




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
