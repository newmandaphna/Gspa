"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addDaysIso, todayIso } from "@/lib/time";
import { cn } from "@/lib/cn";

type SlotDto = { time: string; label: string; available: number };
type Dto = { open: boolean; slots: SlotDto[] };

type State = { status: "loading" } | { status: "ready"; date: string; label: "Tonight" | "Tomorrow" | "This week"; slots: SlotDto[] } | { status: "none" };

/**
 * "Tonight is available." The next six open lane slots, deep-linked into
 * /reserve. Falls forward to tomorrow (then the next open day) when today
 * is full or closed.
 */
export function AvailabilityStrip({ experience = "lane-session", className }: { experience?: string; className?: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const today = todayIso();
      const candidates: Array<{ date: string; label: "Tonight" | "Tomorrow" | "This week" }> = [
        { date: today, label: "Tonight" },
        { date: addDaysIso(today, 1), label: "Tomorrow" },
        { date: addDaysIso(today, 2), label: "This week" },
        { date: addDaysIso(today, 3), label: "This week" },
      ];
      for (const c of candidates) {
        try {
          const res = await fetch(`/api/availability?experience=${experience}&date=${c.date}`, { cache: "no-store" });
          if (!res.ok) continue;
          const data = (await res.json()) as Dto;
          const slots = data.open ? data.slots.filter((s) => s.available > 0).slice(0, 6) : [];
          if (slots.length) {
            if (!cancelled) setState({ status: "ready", date: c.date, label: c.label, slots });
            return;
          }
        } catch {
          /* try the next day */
        }
      }
      if (!cancelled) setState({ status: "none" });
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [experience]);

  const unit = experience === "lane-session" ? "lanes" : "open";

  return (
    <div className={cn("w-full", className)} aria-live="polite">
      <p className="t-eyebrow text-muted">
        {state.status === "ready" ? `Lanes · ${state.label.toLowerCase()}` : "Lanes"}
      </p>
      <h2 className="t-1 mt-3">
        {state.status === "ready" ? `${state.label} is available.` : state.status === "none" ? "This week is filling up." : "Checking tonight."}
      </h2>
      <p className="t-lead mt-2 text-muted">Live availability. Reserved in under a minute.</p>
      <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-2">
        {state.status === "loading" &&
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-11 w-36 shrink-0 animate-pulse rounded-pill bg-current opacity-10" />)}
        {state.status === "ready" &&
          state.slots.map((s) => (
            <Link
              key={s.time}
              href={`/reserve?experience=${experience}&date=${state.date}&time=${s.time}`}
              className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-pill px-4 font-mono text-[0.875rem] ring-1 ring-inset ring-current/25 transition-[background-color,box-shadow] duration-200 hover:ring-accent [[data-theme=dark]_&]:hover:ring-accent-2"
            >
              <span className="font-medium">{s.label}</span>
              <span className="text-muted">
                · {s.available} {unit}
              </span>
            </Link>
          ))}
        {state.status === "none" && (
          <Link href="/reserve" className="link-arrow">
            See the full calendar
          </Link>
        )}
      </div>
    </div>
  );
}
