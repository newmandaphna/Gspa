"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { computeOpenStatus, type OpenStatus } from "@/lib/hours";

/**
 * The open/closed line. The server computes the first value so it is in the
 * HTML; after mount the browser recomputes it every minute (and on the next
 * minute boundary) so "Open until 10 PM" turns over without a reload.
 */
export function useOpenStatus(initial: OpenStatus): OpenStatus {
  const [status, setStatus] = useState(initial);
  useEffect(() => {
    const tick = () => setStatus(computeOpenStatus(new Date()));
    tick();
    const msToMinute = 60_000 - (Date.now() % 60_000) + 250;
    let interval: number | undefined;
    const timeout = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, 60_000);
    }, msToMinute);
    return () => {
      window.clearTimeout(timeout);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, []);
  return status;
}

type Props = {
  initial: OpenStatus;
  /** "dot" renders the 6 px dot and the short line; "line" renders the short line alone. */
  variant?: "dot" | "line";
  /** Which text to show. */
  field?: "short" | "long" | "hero";
  className?: string;
  dotClassName?: string;
};

export function LiveStatus({ initial, variant = "dot", field = "short", className, dotClassName }: Props) {
  const status = useOpenStatus(initial);
  return (
    <span className={cn("inline-flex items-center gap-2", className)} data-open={status.open ? "true" : "false"} aria-live="polite">
      {variant === "dot" && (
        <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-500", status.open ? "bg-accent" : "bg-mist", dotClassName)} />
      )}
      <span>{status[field]}</span>
    </span>
  );
}
