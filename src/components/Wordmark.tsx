import { cn } from "@/lib/cn";

/**
 * The logo lockup, rebuilt as inline SVG from the owner's artwork:
 * "GUN" in charcoal, a cartridge as the divider, "SPA" in gold.
 * `tone="current"` inherits the text color for GUN (nav on dark), gold stays gold.
 *
 * To use the original artwork instead, drop it in /public/brand/ and see MEDIA.md.
 */

const GOLD = "#c9a55a";
const CHARCOAL = "#2f3b41";

export function Cartridge({ className, gold = GOLD, body = "currentColor" }: { className?: string; gold?: string; body?: string }) {
  return (
    <svg viewBox="0 0 24 64" className={className} aria-hidden="true">
      {/* bullet */}
      <path d="M12 2c3.2 4.6 5 9.8 5 15.5V22H7v-4.5C7 11.8 8.8 6.6 12 2z" fill={gold} />
      {/* case */}
      <path d="M7 22h10v30H7z" fill="none" stroke={body} strokeWidth="2.2" />
      <path d="M6 52h12M6 56h12" stroke={body} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7 58h10v3H7z" fill={body} />
    </svg>
  );
}

export function Wordmark({ className, tone = "brand", tagline = false }: { className?: string; tone?: "brand" | "current"; tagline?: boolean }) {
  const gun = tone === "current" ? "currentColor" : CHARCOAL;
  return (
    <span className={cn("inline-flex flex-col items-start", className)}>
      <span className="flex h-[1em] items-center gap-[0.32em]" style={{ fontSize: "1em" }}>
        <span
          className="font-[family-name:var(--font-display)] font-medium uppercase leading-none tracking-[0.2em]"
          style={{ color: gun, fontSize: "0.92em" }}
        >
          Gun
        </span>
        <Cartridge className="h-[1.25em] w-auto" body={gun} />
        <span className="font-[family-name:var(--font-display)] font-medium uppercase leading-none tracking-[0.2em]" style={{ color: GOLD, fontSize: "0.92em" }}>
          Spa
        </span>
      </span>
      {tagline && (
        <>
          <span className="mt-[0.35em] block h-[0.14em] w-full" style={{ background: GOLD }} aria-hidden="true" />
          <span className="mt-[0.3em] font-[family-name:var(--font-display)] text-[0.34em] font-semibold uppercase leading-none tracking-[0.12em]">
            <span style={{ color: gun }}>Ready? Aim. </span>
            <span style={{ color: GOLD }}>Relax!</span>
          </span>
        </>
      )}
    </span>
  );
}
