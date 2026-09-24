"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { HOURS, HOURS_DISPLAY, SITE } from "@/lib/config/site";
import { OPEN_STATUS_LABELS } from "@/lib/content/pages/visit";
import { addDaysIso, dayOfWeekIso, labelForHHMM, todayIso, toHHMMInTz } from "@/lib/time";

type Live = { dow: number; status: string };

/** Computes "Open now" / "Opens at" / "Closed today" in the range's timezone. */
function compute(now: Date): Live {
  const tz = SITE.timezone;
  const today = todayIso(tz, now);
  const dow = dayOfWeekIso(today);
  const hhmm = toHHMMInTz(now, tz);
  const h = HOURS[dow];
  const L = OPEN_STATUS_LABELS;

  if (!h) return { dow, status: L.closedToday };
  if (hhmm < h.open) return { dow, status: `${L.opensAt} ${labelForHHMM(h.open)}` };
  if (hhmm < h.close) return { dow, status: `${L.openNow} ${L.until} ${labelForHHMM(h.close)}` };

  // After close: point at the next open day.
  for (let i = 1; i <= 7; i++) {
    const next = HOURS[dayOfWeekIso(addDaysIso(today, i))];
    if (next) {
      const when = i === 1 ? "tomorrow" : new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(`${addDaysIso(today, i)}T00:00:00Z`));
      return { dow, status: `${L.closedForTonight}. ${L.opensAt} ${labelForHHMM(next.open)} ${when}` };
    }
  }
  return { dow, status: L.closedForTonight };
}

/**
 * Hairline hours table. Today's row carries a gold left rule and a live pill.
 * The live state is set after mount so the server and client markup match.
 */
export function HoursTable({ className }: { className?: string }) {
  const [live, setLive] = useState<Live | null>(null);

  useEffect(() => {
    const tick = () => setLive(compute(new Date()));
    const id = window.setInterval(tick, 60_000);
    const raf = window.requestAnimationFrame(tick);
    return () => {
      window.clearInterval(id);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  const isOpen = live?.status.startsWith(OPEN_STATUS_LABELS.openNow) ?? false;

  return (
    <div className={cn("w-full", className)}>
      <table className="w-full border-collapse">
        <caption className="sr-only">Opening hours</caption>
        <tbody>
          {HOURS_DISPLAY.map((row) => {
            const today = live !== null && row.dow.includes(live.dow);
            return (
              <tr key={row.days} className="border-t border-hairline" aria-current={today ? "date" : undefined}>
                <th
                  scope="row"
                  className={cn(
                    "border-l-2 py-6 pl-5 pr-4 text-left align-baseline transition-colors duration-500 sm:pl-6",
                    today ? "border-l-accent" : "border-l-transparent",
                  )}
                >
                  <span className="t-eyebrow text-mist">{row.days}</span>
                  {today && (
                    <span
                      className={cn(
                        "mt-3 inline-flex items-center gap-2 rounded-pill px-3 py-1 font-mono text-[0.75rem] ring-1 ring-inset",
                        isOpen ? "text-accent ring-accent/40" : "text-mist ring-white/15",
                      )}
                      aria-live="polite"
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", isOpen ? "bg-accent" : "bg-mist")} aria-hidden="true" />
                      {live?.status}
                    </span>
                  )}
                </th>
                <td className="t-2 tabular py-6 pr-2 text-right align-baseline whitespace-nowrap">{row.hours}</td>
              </tr>
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
