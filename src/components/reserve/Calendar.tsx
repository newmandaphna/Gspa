"use client";

import { useMemo, useState } from "react";
import { HOURS } from "@/lib/config/site";
import { addDaysIso, compareIso, dayOfWeekIso } from "@/lib/time";
import { cn } from "@/lib/cn";

type Props = {
  value: string | null;
  onChange: (iso: string) => void;
  minDate: string;
  maxDate: string;
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function monthKey(iso: string): { y: number; m: number } {
  const [y, m] = iso.split("-").map(Number);
  return { y, m };
}
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function daysInMonth(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Minimal, keyboard-friendly month grid. Closed days and out-of-window days are disabled. */
export function Calendar({ value, onChange, minDate, maxDate }: Props) {
  const start = monthKey(value ?? minDate);
  const [cursor, setCursor] = useState(start);

  const cells = useMemo(() => {
    const first = `${cursor.y}-${pad(cursor.m)}-01`;
    const lead = dayOfWeekIso(first);
    const n = daysInMonth(cursor.y, cursor.m);
    const out: Array<{ iso: string; day: number } | null> = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= n; d++) out.push({ iso: `${cursor.y}-${pad(cursor.m)}-${pad(d)}`, day: d });
    return out;
  }, [cursor]);

  const title = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(cursor.y, cursor.m - 1, 1)),
  );

  const canPrev = compareIso(`${cursor.y}-${pad(cursor.m)}-01`, minDate.slice(0, 8) + "01") > 0;
  const lastOfMonth = `${cursor.y}-${pad(cursor.m)}-${pad(daysInMonth(cursor.y, cursor.m))}`;
  const canNext = compareIso(lastOfMonth, maxDate) < 0;

  const move = (delta: number) => {
    let m = cursor.m + delta;
    let y = cursor.y;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setCursor({ y, m });
  };

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={!canPrev}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-ink/5 disabled:opacity-25"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">
            <path d="M8 2L2 8l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="t-4">{title}</p>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={!canNext}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-ink/5 disabled:opacity-25"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">
            <path d="M2 2l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center" role="grid" aria-label="Choose a date">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="t-footnote py-1 font-semibold text-ink-faint" aria-hidden="true">
            {d}
          </div>
        ))}
        {cells.map((c, i) =>
          c ? (
            <div key={c.iso} className="flex items-center justify-center py-0.5" role="gridcell">
              {(() => {
                const closed = HOURS[dayOfWeekIso(c.iso)] === null;
                const out = compareIso(c.iso, minDate) < 0 || compareIso(c.iso, maxDate) > 0;
                const disabled = closed || out;
                const selected = value === c.iso;
                return (
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-label={c.iso}
                    onClick={() => onChange(c.iso)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-[0.9375rem] transition-[background-color,color,transform] duration-200",
                      selected ? "bg-ink font-semibold text-snow" : "hover:bg-ink/6",
                      disabled && "cursor-not-allowed text-ink/25 hover:bg-transparent",
                      c.iso === minDate && !selected && "font-semibold",
                    )}
                  >
                    {c.day}
                  </button>
                );
              })()}
            </div>
          ) : (
            <div key={`e${i}`} aria-hidden="true" />
          ),
        )}
      </div>
      <p className="t-footnote mt-3 text-ink-faint">
        {value ? addDaysIso(value, 0) === minDate ? "Today · same-day reservations need one hour's notice" : "" : "Select a day to see available start times"}
      </p>
    </div>
  );
}
