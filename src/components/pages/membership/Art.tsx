import { cn } from "@/lib/cn";

/**
 * Visuals for /membership. Pure SVG so the page looks finished before
 * photography exists. Hairlines stay 1px; one accent element per artwork.
 * The hero beams and the engraved nameplate are gone: the opening and the
 * wall are plain dark bands until MEMBER_CARD_01 and FOUNDERS_WALL_01 exist.
 */

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
