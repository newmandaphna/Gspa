"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deskPhone, deskPhoneHref, RESOURCES, SITE, type ResourceKey } from "@/lib/config/site";
import { addDaysIso, todayIso } from "@/lib/time";
import { cn } from "@/lib/cn";

type SlotDto = { time: string; label: string; available: number };
type Dto = { open: boolean; slots: SlotDto[]; experience?: { resource?: string } };

type Label = "Tonight" | "Tomorrow" | "This week";
type State =
  | { status: "loading" }
  | { status: "ready"; date: string; label: Label; slots: SlotDto[]; capacity: number }
  | { status: "none" }
  | { status: "error" };

// The outage line points at the phone once the owner has set it, and at the desk email until then.
const PHONE = deskPhone();
const CONTACT_HREF = deskPhoneHref() ?? `mailto:${SITE.email}`;
const CONTACT_LABEL = PHONE ?? SITE.email;

/**
 * "Tonight is available." The next open lane slots, deep-linked into
 * /reserve. Falls forward to tomorrow (then the next open day) when today
 * is full or closed. A calendar outage is reported as an outage, with one
 * retry after two seconds, never as a sold-out week. When every slot is at
 * full capacity the pills collapse to one quiet line, so a pill with a
 * number on it means scarcity is real.
 */
export function AvailabilityStrip({ experience = "lane-session", className }: { experience?: string; className?: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let retry: number | undefined;
    const run = async () => {
      const today = todayIso();
      const candidates: Array<{ date: string; label: Label }> = [
        { date: today, label: "Tonight" },
        { date: addDaysIso(today, 1), label: "Tomorrow" },
        { date: addDaysIso(today, 2), label: "This week" },
        { date: addDaysIso(today, 3), label: "This week" },
      ];
      let failed = false;
      for (const c of candidates) {
        try {
          const res = await fetch(`/api/availability?experience=${experience}&date=${c.date}`, { cache: "no-store" });
          if (res.status === 404) break; // the experience is not bookable online
          if (!res.ok) {
            failed = true;
            continue;
          }
          const data = (await res.json()) as Dto;
          const slots = data.open ? data.slots.filter((s) => s.available > 0).slice(0, 6) : [];
          if (slots.length) {
            const resource = (data.experience?.resource ?? "lane") as ResourceKey;
            const capacity = RESOURCES[resource]?.capacity ?? 0;
            if (!cancelled) setState({ status: "ready", date: c.date, label: c.label, slots, capacity });
            return;
          }
        } catch {
          failed = true;
        }
      }
      if (cancelled) return;
      if (failed) {
        // One retry after 2 s, then say so.
        if (attempt === 0) retry = window.setTimeout(() => setAttempt(1), 2000);
        else setState({ status: "error" });
        return;
      }
      setState({ status: "none" });
    };
    void run();
    return () => {
      cancelled = true;
      if (retry !== undefined) window.clearTimeout(retry);
    };
  }, [experience, attempt]);

  const unit = experience === "lane-session" ? "lanes" : "open";
  const quiet = state.status === "ready" && state.capacity > 0 && state.slots.every((s) => s.available >= state.capacity);

  const headline =
    state.status === "ready"
      ? `${state.label} is available.`
      : state.status === "none"
        ? "This week is filling up."
        : state.status === "error"
          ? "We can't reach the calendar right now."
          : "Checking tonight.";

  return (
    <div className={cn("w-full", className)} aria-live="polite">
      <p className="t-eyebrow text-muted">{state.status === "ready" ? `Lanes · ${state.label.toLowerCase()}` : "Lanes"}</p>
      <h2 className="t-1 mt-3">{headline}</h2>
      <p className="t-lead mt-2 text-muted">
        {state.status === "error" ? (
          <>
            {PHONE ? "Call" : "Email"} the desk at{" "}
            <a href={CONTACT_HREF} className="underline underline-offset-4">
              {CONTACT_LABEL}
            </a>{" "}
            or try again.
          </>
        ) : (
          "Live availability. Reserved in under a minute."
        )}
      </p>
      <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-2">
        {state.status === "loading" &&
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-11 w-36 shrink-0 animate-pulse rounded-pill bg-current opacity-10" />)}
        {state.status === "ready" && quiet && (
          <Link
            href={`/reserve?experience=${experience}&date=${state.date}&time=${state.slots[0].time}`}
            className="group inline-flex min-h-11 items-center gap-2 rounded-pill px-4 py-2 font-mono text-[0.875rem] ring-1 ring-inset ring-current/25 transition-[background-color,box-shadow] duration-200 hover:ring-accent [[data-theme=dark]_&]:hover:ring-accent-2"
          >
            <span className="font-medium">
              Quiet {state.label.toLowerCase()}, {state.capacity} {unit} open from {state.slots[0].label}
            </span>
          </Link>
        )}
        {state.status === "ready" &&
          !quiet &&
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
        {state.status === "error" && (
          <button
            type="button"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((a) => a + 1);
            }}
            className="inline-flex h-11 shrink-0 items-center rounded-pill px-5 font-mono text-[0.875rem] ring-1 ring-inset ring-current/25 transition-[box-shadow] duration-200 hover:ring-accent"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
