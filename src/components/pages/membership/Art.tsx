import { cn } from "@/lib/cn";

/**
 * Visuals for /membership. Pure CSS/SVG so the page looks finished before
 * photography exists. Hairlines stay 1px; one accent element per artwork.
 */

/** Three vertical light beams rising from the bottom edge; the center one is gold-tinted. */
export function HeroBeams({ className }: { className?: string }) {
  const beams = [
    { left: "22%", width: "16vw", bg: "linear-gradient(to top, rgba(255,255,255,0.06), rgba(255,255,255,0.02) 55%, transparent 85%)", skew: "-7deg" },
    { left: "50%", width: "20vw", bg: "linear-gradient(to top, rgba(201,165,90,0.16), rgba(201,165,90,0.06) 45%, transparent 80%)", skew: "0deg" },
    { left: "78%", width: "16vw", bg: "linear-gradient(to top, rgba(255,255,255,0.06), rgba(255,255,255,0.02) 55%, transparent 85%)", skew: "7deg" },
  ];
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {beams.map((b, i) => (
        <div
          key={i}
          className="absolute bottom-0 h-[115%] max-w-[300px] min-w-[96px] -translate-x-1/2"
          style={{ left: b.left, width: b.width, background: b.bg, transform: `translateX(-50%) skewX(${b.skew})`, transformOrigin: "bottom center" }}
        />
      ))}
      {/* floor glow where the beams land */}
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{ background: "linear-gradient(to top, rgba(255,255,255,0.05), transparent)" }}
      />
    </div>
  );
}

/** Engraved nameplate: "001 / 50" on brushed paper with a hairline frame. */
export function Nameplate({ cap, className }: { cap: number; className?: string }) {
  const first = "1".padStart(String(cap).length + 1, "0");
  return (
    <svg viewBox="0 0 640 360" className={cn("h-full w-full", className)} aria-hidden="true">
      <defs>
        <linearGradient id="np-brush" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5f5f7" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ececf0" />
        </linearGradient>
        <linearGradient id="np-rule" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c9a55a" stopOpacity="0" />
          <stop offset="0.5" stopColor="#c9a55a" stopOpacity="1" />
          <stop offset="1" stopColor="#c9a55a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="#f5f5f7" />
      {/* wall grid of other plates, faint */}
      {[40, 600].map((x) => (
        <rect key={x} x={x - 220} y="100" width="200" height="160" rx="14" fill="none" stroke="#d2d2d7" strokeWidth="1" opacity="0.5" />
      ))}
      {/* the plate */}
      <rect x="140" y="100" width="360" height="160" rx="14" fill="url(#np-brush)" stroke="#d2d2d7" strokeWidth="1" />
      <rect x="141" y="101" width="358" height="158" rx="13" fill="none" stroke="#ffffff" strokeWidth="1" />
      {/* screws */}
      {[
        [160, 120],
        [480, 120],
        [160, 240],
        [480, 240],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="none" stroke="#d2d2d7" strokeWidth="1" />
      ))}
      {/* engraved numeral: shadow pass then ink pass */}
      <text
        x="320"
        y="196"
        textAnchor="middle"
        fontFamily="var(--font-display), Inter, sans-serif"
        fontWeight="600"
        fontSize="64"
        letterSpacing="-2"
        fill="#ffffff"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {first} / {cap}
      </text>
      <text
        x="320"
        y="195"
        textAnchor="middle"
        fontFamily="var(--font-display), Inter, sans-serif"
        fontWeight="600"
        fontSize="64"
        letterSpacing="-2"
        fill="#1d1d1f"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {first} / {cap}
      </text>
      <rect x="220" y="222" width="200" height="1" fill="url(#np-rule)" />
    </svg>
  );
}

/** Hairline shield that fills gold when a parent gains the `in-view` class. */
export function Shield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 28" className={cn("h-6 w-6", className)} aria-hidden="true">
      <path
        d="M12 1.5 21.5 5v8.2c0 6-4 10.6-9.5 13.3C6.5 23.8 2.5 19.2 2.5 13.2V5L12 1.5z"
        fill="#c9a55a"
        fillOpacity="0"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1"
        className="transition-[fill-opacity] duration-700 ease-[var(--ease-apple)] [.in-view_&]:[fill-opacity:1]"
      />
      <path d="M8.5 13.5l2.4 2.4 4.8-5" fill="none" stroke="#000" strokeOpacity="0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="transition-[stroke-opacity] delay-300 duration-500 [.in-view_&]:[stroke-opacity:0.8]" />
    </svg>
  );
}

/** Gold check for the compare table. */
export function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("h-5 w-5", className)} aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
