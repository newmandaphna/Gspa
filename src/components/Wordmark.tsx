import { cn } from "@/lib/cn";

/**
 * Text-based wordmark with a target glyph. Swap for the real logo SVG when
 * brand assets exist — keep the same height so the nav stays aligned.
 */
export function Wordmark({ className, stacked = false }: { className?: string; stacked?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-current", stacked && "flex-col gap-3", className)}>
      <svg viewBox="0 0 24 24" className={cn("h-full w-auto", stacked && "h-10")} aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <path d="M12 0v3.5M12 20.5V24M0 12h3.5M20.5 12H24" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span className="font-semibold uppercase leading-none tracking-[0.22em]" style={{ fontSize: "0.72em" }}>
        The Gun Spa
      </span>
    </span>
  );
}
