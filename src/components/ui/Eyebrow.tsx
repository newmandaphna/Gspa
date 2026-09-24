import { cn } from "@/lib/cn";

/**
 * A running head: one mono line that states a fact ("12 lanes · 25 yd · own air",
 * "Open until 10 tonight"). Never a label that repeats the headline under it.
 * Ink on light bands, mist on dark ones; gold is reserved for one element per
 * viewport, so pass `accent` only when this line is that element.
 */
export function Eyebrow({ children, className, accent = false }: { children: React.ReactNode; className?: string; accent?: boolean }) {
  return (
    <p
      className={cn(
        "font-mono text-[0.75rem] uppercase leading-[1.4] tracking-[0.12em]",
        accent ? "text-accent-deep [[data-theme=dark]_&]:text-accent" : "text-ink [[data-theme=dark]_&]:text-mist",
        className,
      )}
    >
      {children}
    </p>
  );
}
