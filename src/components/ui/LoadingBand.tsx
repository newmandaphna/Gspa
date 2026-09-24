import { Container } from "@/components/ui/Container";
import { Section, type Theme } from "@/components/ui/Section";
import { cn } from "@/lib/cn";

/**
 * What a route shows while its server data loads: the band in the page's own
 * theme with three faint bars where the headline will sit, so the black nav
 * never hangs over a white void. The pulse rests under reduced motion.
 */
export function LoadingBand({ theme = "light", className, label = "Loading" }: { theme?: Theme; className?: string; label?: string }) {
  const dark = theme === "dark" || theme === "black";
  const bar = cn("animate-pulse rounded-full", dark ? "bg-white/10" : "bg-ink/8");
  return (
    <Section theme={theme} className={cn("min-h-dvh pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]", dark && "grain overflow-hidden", className)} aria-busy="true" aria-live="polite">
      <Container>
        <p className="sr-only">{label}</p>
        <div aria-hidden="true">
          <div className={cn(bar, "h-3 w-24")} />
          <div className={cn(bar, "mt-6 h-12 w-[min(560px,80%)]")} />
          <div className={cn(bar, "mt-4 h-5 w-[min(420px,60%)]")} />
        </div>
      </Container>
    </Section>
  );
}
