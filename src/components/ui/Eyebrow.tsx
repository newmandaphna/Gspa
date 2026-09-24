import { cn } from "@/lib/cn";

/**
 * Small uppercase label. Gold adapts to the band: the deeper gold on light
 * backgrounds (AA contrast), the true logo gold on dark ones.
 */
export function Eyebrow({ children, className, accent = true }: { children: React.ReactNode; className?: string; accent?: boolean }) {
  return <p className={cn("t-eyebrow", accent ? "text-accent-deep [[data-theme=dark]_&]:text-accent" : "text-muted", className)}>{children}</p>;
}
