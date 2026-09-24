"use client";

import { useEffect, useState } from "react";
import { upcomingClasses, type ClassFlags, type PublicClassSession } from "@/lib/public-classes";

type Result = ClassFlags & { sessions: PublicClassSession[]; error: string; busy: boolean; key: string };
const initial: Result = { sessions: [], paymentsEnabled: false, documentsEnabled: false, error: "", busy: true, key: "" };

/** Refresh public data without accepting responses from an obsolete request or lifecycle. */
export function usePublicClasses(date = "") {
  const [result, setResult] = useState<Result>(initial);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    let generation = 0;
    let controller: AbortController | undefined;
    const load = async () => {
      const current = ++generation;
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(`/api/classes${date ? `?date=${encodeURIComponent(date)}` : ""}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.sessions)) throw new Error("Class dates could not be loaded. Please try again.");
        if (alive && current === generation) setResult({ key: date, busy: false, error: "", sessions: upcomingClasses(data.sessions as PublicClassSession[]), paymentsEnabled: data.paymentsEnabled === true, documentsEnabled: data.documentsEnabled === true });
      } catch (error) {
        if (alive && current === generation && !controller.signal.aborted) setResult({ ...initial, key: date, busy: false, error: error instanceof Error ? error.message : "Class dates could not be loaded." });
      }
    };
    queueMicrotask(() => { if (alive) setResult({ ...initial, key: date }); });
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    const focus = () => { void load(); };
    window.addEventListener("focus", focus);
    return () => { alive = false; generation++; controller?.abort(); window.clearInterval(timer); window.removeEventListener("focus", focus); };
  }, [date, retry]);
  return { ...(result.key === date ? result : initial), reload: () => setRetry(n => n + 1) };
}