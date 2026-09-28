import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The text link with a ruled arrow: a short line and a head that lengthens on hover,
 * set as a small capitals label. Used for secondary actions beside a button or alone.
 */
export function LinkArrow({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("link-arrow group/arrow", className)}>
      <span>{children}</span>
      <svg className="shrink-0" width="30" height="10" viewBox="0 0 30 10" fill="none" aria-hidden="true">
        <path className="transition-transform duration-300 ease-[var(--ease-snap)] origin-left group-hover/arrow:scale-x-[1.35]" d="M0 5h27" stroke="currentColor" strokeWidth="1.2" />
        <path className="transition-transform duration-300 ease-[var(--ease-snap)] group-hover/arrow:translate-x-[9px]" d="M23 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </Link>
  );
}
