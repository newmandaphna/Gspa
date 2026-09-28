import { cn } from "@/lib/cn";

/**
 * Visuals for /membership. Pure SVG so the page looks finished before
 * photography exists. Hairlines stay 1px; one accent element per artwork.
 * The hero beams and the engraved nameplate are gone: the opening and the
 * wall are plain dark bands until MEMBER_CARD_01 and FOUNDERS_WALL_01 exist.
 */

/** The last step's mark: a primer, hairline until its parent gains `in-view`, then brass. */
export function Shield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("h-5 w-5", className)} aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill="#c9a55a" fillOpacity="0" stroke="rgba(255,255,255,0.35)" strokeWidth="1" className="transition-[fill-opacity] duration-700 ease-[var(--ease-apple)] [.in-view_&]:[fill-opacity:1]" />
      <circle cx="10" cy="10" r="3.2" fill="#0a0a0b" fillOpacity="0" className="transition-[fill-opacity] delay-300 duration-500 [.in-view_&]:[fill-opacity:0.75]" />
    </svg>
  );
}

/** Gold check for the compare table. */
export function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("h-5 w-5", className)} aria-hidden="true">
      <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="10" cy="10" r="2.8" fill="currentColor" />
    </svg>
  );
}
