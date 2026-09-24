import { cn } from "@/lib/cn";
import { CAP_HEIGHT, GUN, SPA, TAGLINE } from "@/components/wordmark-paths";

/**
 * The logo lockup, rebuilt as inline SVG from the owner's artwork:
 * "GUN" in charcoal, a cartridge as the divider, "SPA" in gold.
 * `tone="current"` inherits the text color for GUN (nav on dark), gold stays gold.
 *
 * The letters are outlined path data (scripts/outline-wordmark.mjs sets them in
 * Montserrat and writes wordmark-paths.ts), so no brand font is downloaded and
 * the mark paints with the first byte of HTML. Sizing is in em: the lockup is
 * 1.25em tall, letters at 0.9em cap-centered on the cartridge, the same
 * proportions the text version used.
 *
 * To use the original artwork instead, drop it in /public/brand/ and see MEDIA.md.
 */

const GOLD = "#c9a55a";
const CHARCOAL = "#2f3b41";

/* Lockup geometry, 1000 units per em of the wrapper's font-size. */
const LETTER_SCALE = 0.9;
const CARTRIDGE_H = 1250; // 1.25em
const CARTRIDGE_W = (CARTRIDGE_H * 24) / 64;
const GAP = 320; // 0.32em
const GUN_W = GUN.width * LETTER_SCALE;
const SPA_W = SPA.width * LETTER_SCALE;
const CAP_TOP = (CARTRIDGE_H - CAP_HEIGHT * LETTER_SCALE) / 2;
const CARTRIDGE_X = GUN_W + GAP;
const SPA_X = CARTRIDGE_X + CARTRIDGE_W + GAP;
const LOCKUP_W = SPA_X + SPA_W;

export function Cartridge({ className, gold = GOLD, body = "currentColor" }: { className?: string; gold?: string; body?: string }) {
  return (
    <svg viewBox="0 0 24 64" className={className} aria-hidden="true">
      <CartridgePaths gold={gold} body={body} />
    </svg>
  );
}

function CartridgePaths({ gold, body }: { gold: string; body: string }) {
  return (
    <>
      {/* bullet */}
      <path d="M12 2c3.2 4.6 5 9.8 5 15.5V22H7v-4.5C7 11.8 8.8 6.6 12 2z" fill={gold} />
      {/* case */}
      <path d="M7 22h10v30H7z" fill="none" stroke={body} strokeWidth="2.2" />
      <path d="M6 52h12M6 56h12" stroke={body} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7 58h10v3H7z" fill={body} />
    </>
  );
}

export function Wordmark({ className, tone = "brand", tagline = false }: { className?: string; tone?: "brand" | "current"; tagline?: boolean }) {
  const gun = tone === "current" ? "currentColor" : CHARCOAL;
  return (
    <span className={cn("inline-flex flex-col items-start", className)}>
      <svg
        viewBox={`0 0 ${LOCKUP_W} ${CARTRIDGE_H}`}
        className="block h-[1.25em] w-auto"
        role="img"
        aria-label="Gun Spa"
        style={{ width: `${LOCKUP_W / 1000}em` }}
      >
        <g transform={`translate(0 ${CAP_TOP}) scale(${LETTER_SCALE})`}>
          <path d={GUN.d} fill={gun} />
        </g>
        <g transform={`translate(${CARTRIDGE_X} 0) scale(${CARTRIDGE_H / 64})`}>
          <CartridgePaths gold={GOLD} body={gun} />
        </g>
        <g transform={`translate(${SPA_X} ${CAP_TOP}) scale(${LETTER_SCALE})`}>
          <path d={SPA.d} fill={GOLD} />
        </g>
      </svg>
      {tagline && (
        <>
          <span className="mt-[0.35em] block h-[0.14em] w-full" style={{ background: GOLD }} aria-hidden="true" />
          <svg
            viewBox={`0 -30 ${TAGLINE.width} ${CAP_HEIGHT + 60}`}
            className="mt-[0.32em] block h-auto w-full"
            role="img"
            aria-label="Ready? Aim. Relax!"
          >
            <path d={TAGLINE.ready} fill={gun} />
            <path d={TAGLINE.relax} fill={GOLD} />
          </svg>
        </>
      )}
    </span>
  );
}
