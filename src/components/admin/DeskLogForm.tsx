"use client";

import { useActionState, useState } from "react";
import { addDeskLogAction, type DeskLogActionState } from "@/app/admin/(protected)/desk-log/actions";
import { adminInput } from "@/app/admin/styles";
import { cn } from "@/lib/cn";

/** Date, one line with a live character count, initials. */
export function DeskLogForm({ today, max, saved }: { today: string; max: number; saved: boolean }) {
  const [state, action, pending] = useActionState<DeskLogActionState, FormData>(addDeskLogAction, {});
  const [text, setText] = useState("");
  const left = max - text.length;
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)_90px_auto] sm:items-end">
      <div>
        <label htmlFor="desk-date" className="t-footnote font-semibold">
          Date
        </label>
        <input id="desk-date" name="date" type="date" required defaultValue={today} className={adminInput} />
      </div>
      <div>
        <label htmlFor="desk-text" className="t-footnote font-semibold">
          The line{" "}
          <span className={cn("font-normal tabular", left < 0 ? "text-danger" : "text-ink-muted")} aria-live="polite">
            ({left} left)
          </span>
        </label>
        <input
          id="desk-text"
          name="text"
          required
          maxLength={max}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Lane 4 carrier back in service."
          className={cn(adminInput, "font-mono")}
        />
      </div>
      <div>
        <label htmlFor="desk-initials" className="t-footnote font-semibold">
          Initials
        </label>
        <input id="desk-initials" name="initials" required maxLength={4} pattern="[A-Za-z]{1,4}" placeholder="GS" className={cn(adminInput, "font-mono uppercase")} />
      </div>
      <button type="submit" disabled={pending || left < 0} className="h-10 rounded-pill bg-ink px-5 text-[0.9375rem] font-medium text-snow disabled:opacity-40">
        {pending ? "Saving" : "Add"}
      </button>
      {state.error && (
        <p role="alert" className="t-caption text-danger sm:col-span-4">
          {state.error}
        </p>
      )}
      {saved && !state.error && (
        <p className="t-caption text-success sm:col-span-4" role="status">
          Saved. It is on the site now.
        </p>
      )}
    </form>
  );
}
