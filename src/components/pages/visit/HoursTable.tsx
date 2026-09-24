"use client";

import { Fragment } from "react";
import { cn } from "@/lib/cn";
import { HOURS_DISPLAY } from "@/lib/config/site";
import { computeOpenStatus, type OpenStatus } from "@/lib/hours";
import { useOpenStatus } from "@/components/LiveStatus";

/**
 * Hairline hours table. Today's row carries a gold left rule and a live pill.
 * The pill gets its own full-width row under the day name: the hours cell is
 * `whitespace-nowrap` at t-2, which leaves the day cell too narrow for the
 * pill on phones. The open/closed line comes from src/lib/hours.ts, the same
 * function the nav and footer read; pass `initial` from a server component
 * so the first paint already carries it, and it refreshes each minute.
 */
export function HoursTable({ initial, className }: { initial?: OpenStatus; className?: string }) {
  const live = useOpenStatus(initial ?? computeOpenStatus(new Date()));

  return (
    <div className={cn("w-full", className)}>
      <table className="w-full border-collapse">
        <caption className="sr-only">Opening hours</caption>
        <tbody>
          {HOURS_DISPLAY.map((row) => {
            const today = row.dow.includes(live.dow);
            return (
              <Fragment key={row.days}>
                <tr className="border-t border-hairline" aria-current={today ? "date" : undefined}>
                  <th
                    scope="row"
                    className={cn(
                      "border-l-2 pl-5 pr-4 text-left align-baseline transition-colors duration-500 sm:pl-6",
                      today ? "border-l-accent pt-6 pb-3" : "border-l-transparent py-6",
                    )}
                  >
                    <span className="t-eyebrow text-mist">{row.days}</span>
                  </th>
                  <td className={cn("t-2 tabular pr-2 text-right align-baseline whitespace-nowrap", today ? "pt-6 pb-3" : "py-6")}>{row.hours}</td>
                </tr>
                {today && (
                  <tr>
                    {/* The gold rule repeats here so it runs unbroken through the pill row. */}
                    <td colSpan={2} className="border-l-2 border-l-accent pb-6 pl-5 sm:pl-6">
                      <span
                        className={cn(
                          "inline-flex items-start gap-2 rounded-pill px-3 py-1 font-mono text-[0.75rem] ring-1 ring-inset",
                          live.open ? "text-accent ring-accent/40" : "text-mist ring-white/15",
                        )}
                        aria-live="polite"
                      >
                        <span className={cn("mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full", live.open ? "bg-accent" : "bg-mist")} aria-hidden="true" />
                        {live.long}
                      </span>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          <tr className="border-t border-hairline">
            <td colSpan={2} className="p-0" aria-hidden="true" />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
