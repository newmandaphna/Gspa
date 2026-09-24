"use client";

import { useEffect, useState } from "react";
import { useOpenStatus } from "@/components/LiveStatus";
import type { OpenStatus } from "@/lib/hours";
import { todayIso } from "@/lib/time";

type Dto = { open: boolean; slots: { time: string; label: string; available: number }[] };

/**
 * The home page's silent section: one line, nothing else. "Tonight, 9 lanes."
 * when the calendar answers, otherwise the same open/closed line the nav uses,
 * so the sentence is always true. Counts come from /api/availability for
 * today's lane sessions; the largest free count of the evening is the number.
 */
export function Tonight({ initial }: { initial: OpenStatus }) {
  const status = useOpenStatus(initial);
  const [lanes, setLanes] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/availability?experience=lane-session&date=${todayIso()}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Dto>) : null))
      .then((d) => {
        if (cancelled || !d || !d.open || d.slots.length === 0) return;
        setLanes(Math.max(0, ...d.slots.map((s) => s.available)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Today's calendar answered with free lanes: say so. Otherwise the open/closed line, which is always true.
  const line = lanes !== null && lanes > 0 ? `Tonight, ${lanes} ${lanes === 1 ? "lane" : "lanes"}.` : status.hero;
  return (
    <p className="t-display" aria-live="polite">
      {line}
    </p>
  );
}
