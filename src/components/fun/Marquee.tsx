import { cn } from "@/lib/cn";

/**
 * A slow ticker band. The items repeat twice so the loop is seamless; the
 * animation pauses on hover and stops for reduced motion (see globals.css).
 * The second copy is hidden from assistive technology.
 */
export function Marquee({ items, className, speed = 38 }: { items: string[]; className?: string; speed?: number }) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((it, i) => (
        <li key={i} className="flex items-center">
          <span className="whitespace-nowrap px-6">{it}</span>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="shrink-0 opacity-80">
            <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="7" cy="7" r="1.6" fill="currentColor" />
          </svg>
        </li>
      ))}
    </ul>
  );
  return (
    <div className={cn("marquee group/marquee relative flex overflow-hidden", className)} style={{ "--marquee-speed": `${speed}s` } as React.CSSProperties}>
      <div className="marquee-track flex">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
