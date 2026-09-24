import { cn } from "@/lib/cn";

/**
 * One pull quote per page: italic serif at t-2 between two hairlines. Until
 * members and instructors have supplied quotes, the only lines that go here
 * are the house lines ("No alcohol, ever.", "Nobody skips a step.",
 * "The clock belongs to the NYPD."). Never attribute a house line to a person.
 */
export function PullQuote({ children, cite, className }: { children: React.ReactNode; cite?: string; className?: string }) {
  return (
    <blockquote className={cn("hairline m-0 border-y py-8 sm:py-10", className)}>
      <p className="t-2 t-italic m-0 max-w-[20em]">{children}</p>
      {cite && <footer className="mt-4 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-muted">{cite}</footer>}
    </blockquote>
  );
}
