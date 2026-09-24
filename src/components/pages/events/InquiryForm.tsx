"use client";

import { useId, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { BUDGETS, EVENT_FORM, OCCASIONS, type Occasion } from "@/lib/content/pages/events";
import { todayIso } from "@/lib/time";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "ok"; id: number | string } | { kind: "error"; message: string };

const field =
  "mt-2 block h-11 w-full rounded-xl bg-white px-4 text-[1.0625rem] text-ink ring-1 ring-inset ring-ink/15 transition-[box-shadow] duration-200 placeholder:text-ink-faint hover:ring-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-deep";
const labelCls = "t-caption font-medium text-ink";

/** Number field with minus and plus buttons. */
function Stepper({ id, label, value, min, max, onChange, hint }: { id: string; label: string; value: number; min: number; max: number; onChange: (n: number) => void; hint?: string }) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? Math.round(n) : min));
  const btn = "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink ring-1 ring-inset ring-ink/15 transition-[background-color] hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none";
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" className={btn} aria-label={`Fewer: ${label}`} onClick={() => onChange(clamp(value - 1))} disabled={value <= min}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(clamp(e.target.valueAsNumber))}
          className={cn(field, "mt-0 w-24 text-center font-mono tabular")}
        />
        <button type="button" className={btn} aria-label={`More: ${label}`} onClick={() => onChange(clamp(value + 1))} disabled={value >= max}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 7h10M7 2v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {hint && <p className="t-footnote mt-2 text-ink-muted">{hint}</p>}
    </div>
  );
}

/**
 * Event inquiry. Posts JSON to /api/inquiries with kind "event"; the extra
 * fields (occasion, license holders, budget, notes) travel in the message as
 * "Key: value" lines so the desk reads them in one place.
 */
export function InquiryForm({ className }: { className?: string }) {
  const uid = useId();
  const f = EVENT_FORM;
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [guests, setGuests] = useState<number>(f.guests.initial);
  const [occasion, setOccasion] = useState<Occasion | "">("");
  const [licenseHolders, setLicenseHolders] = useState(0);
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const holders = Math.min(licenseHolders, guests);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "sending") return;
    if (!name.trim()) return setStatus({ kind: "error", message: f.errors.name });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setStatus({ kind: "error", message: f.errors.email });

    const k = f.messageKeys;
    const message = [
      `${k.occasion}: ${occasion || f.unspecified}`,
      `${k.licenseHolders}: ${holders}`,
      `${k.budget}: ${budget || f.unspecified}`,
      `${k.notes}: ${notes.trim() || f.unspecified}`,
    ].join("\n");

    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "event",
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          company: company.trim(),
          guests,
          preferredDate,
          message,
          website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: number | string; error?: string };
      if (res.ok && data.ok && data.id !== undefined) {
        setStatus({ kind: "ok", id: data.id });
      } else {
        setStatus({ kind: "error", message: data.error || f.errors.generic });
      }
    } catch {
      setStatus({ kind: "error", message: f.errors.generic });
    }
  }

  const card = cn("glass relative rounded-card p-6 ring-1 ring-ink/10 shadow-[var(--shadow-card)] sm:p-10", className);

  if (status.kind === "ok") {
    return (
      <div className={card} role="status" aria-live="polite">
        <p className="t-3 text-accent-deep">{f.success}</p>
        <p className="mt-3 font-mono text-[0.9375rem] tabular text-ink-muted">
          {f.referencePrefix}
          {status.id}
        </p>
      </div>
    );
  }

  return (
    <form className={card} onSubmit={onSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-name`} className={labelCls}>
            {f.fields.name.label}
          </label>
          <input id={`${uid}-name`} name="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder={f.fields.name.placeholder} className={field} />
        </div>
        <div>
          <label htmlFor={`${uid}-company`} className={labelCls}>
            {f.fields.company.label}
          </label>
          <input id={`${uid}-company`} name="company" autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} placeholder={f.fields.company.placeholder} className={field} />
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className={labelCls}>
            {f.fields.email.label}
          </label>
          <input id={`${uid}-email`} name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={f.fields.email.placeholder} className={field} />
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className={labelCls}>
            {f.fields.phone.label}
          </label>
          <input id={`${uid}-phone`} name="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={f.fields.phone.placeholder} className={field} />
        </div>
        <div>
          <label htmlFor={`${uid}-date`} className={labelCls}>
            {f.fields.preferredDate.label}
          </label>
          <input id={`${uid}-date`} name="preferredDate" type="date" min={todayIso()} value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} className={field} />
        </div>
        <Stepper id={`${uid}-guests`} label={f.fields.guests.label} value={guests} min={f.guests.min} max={f.guests.max} onChange={setGuests} />

        <fieldset className="sm:col-span-2">
          <legend className={labelCls}>{f.fields.occasion.label}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <label key={o} className="cursor-pointer">
                <input type="radio" name="occasion" value={o} checked={occasion === o} onChange={() => setOccasion(o)} className="peer sr-only" />
                <span className="inline-flex h-10 items-center rounded-pill px-4 text-[0.9375rem] text-ink ring-1 ring-inset ring-ink/15 transition-[background-color,box-shadow,color] duration-200 hover:bg-ink/5 peer-checked:bg-ink peer-checked:text-snow peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-accent-deep">
                  {o}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Stepper id={`${uid}-holders`} label={f.fields.licenseHolders.label} value={holders} min={0} max={guests} onChange={setLicenseHolders} hint={f.fields.licenseHolders.hint} />
        <div>
          <label htmlFor={`${uid}-budget`} className={labelCls}>
            {f.fields.budget.label}
          </label>
          <div className="relative">
            <select id={`${uid}-budget`} name="budget" value={budget} onChange={(e) => setBudget(e.target.value)} className={cn(field, "appearance-none pr-10")}>
              <option value="">{f.fields.budget.placeholder}</option>
              {BUDGETS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-ink-muted">
              <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-notes`} className={labelCls}>
            {f.fields.notes.label}
          </label>
          <textarea id={`${uid}-notes`} name="notes" rows={4} maxLength={1500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={f.fields.notes.placeholder} className={cn(field, "h-auto resize-y py-3")} />
        </div>
      </div>

      {/* Honeypot: real people never see or fill this. */}
      <div className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status.kind === "sending"}
          className="inline-flex h-[52px] items-center justify-center rounded-pill bg-ink px-7 text-[1.125rem] font-medium text-snow transition-[background-color,transform] duration-200 hover:bg-night-3 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
        >
          {status.kind === "sending" ? f.sending : f.submit}
        </button>
        {status.kind === "error" && (
          <p className="t-caption text-danger" role="alert">
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}
