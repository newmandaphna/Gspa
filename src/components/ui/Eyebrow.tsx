import { cn } from "@/lib/cn";

export function Eyebrow({ children, className, accent = true }: { children: React.ReactNode; className?: string; accent?: boolean }) {
  return <p className={cn("t-eyebrow", accent ? "text-accent" : "text-muted", className)}>{children}</p>;
}
