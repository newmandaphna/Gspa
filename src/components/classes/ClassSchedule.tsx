"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/cn";
import { CLASSES } from "@/lib/content/pages/training";
import { classAvailability, classDateRange, classPrice, type PublicClassSession } from "@/lib/public-classes";
import { usePublicClasses } from "./usePublicClasses";

type Session = PublicClassSession;
type Address = { line1: string; line2: string; city: string; state: string; postalCode: string; country: string };
const initialAddress: Address = { line1: "", line2: "", city: "", state: "", postalCode: "", country: "US" };
const ADDRESS_KEYS = ["line1", "line2", "city", "state", "postalCode", "country"] as const satisfies ReadonlyArray<keyof Address>;
const money = classPrice;
const C = CLASSES;
const L = CLASSES.enroll.labels;

/* The field style from FoundersRequest, set for paper: white wells, a hairline ring, gold on focus. */
const field =
  "h-11 w-full rounded-[12px] bg-white px-4 text-[1.0625rem] text-ink ring-1 ring-inset ring-ink/15 placeholder:text-ink-faint transition-[box-shadow,background-color] duration-200 focus:ring-accent-deep focus:outline-none aria-[invalid=true]:ring-danger";
const labelCls = "t-caption mb-2 block font-medium text-ink-muted";
const legendCls = "t-caption mb-3 block font-medium text-ink-muted";

/**
 * The schedule: every date the desk has posted, one hairline row each, and
 * the seat form for the chosen one beside it. The chosen date lives in the
 * URL (?session=id) so a link from the home page lands on it; picking a day
 * in the filter clears it.
 */
export function ClassSchedule() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = useId();
  const linkedId = searchParams.get("session");
  const [date, setDate] = useState("");
  const activeDate = linkedId !== null ? "" : date;
  const { sessions, busy, error, reload: load, ...flags } = usePublicClasses(activeDate);
  const selected = !busy && !error && linkedId !== null && /^[1-9]\d*$/.test(linkedId) ? (sessions.find((s) => s.id === Number(linkedId)) ?? null) : null;
  const unavailableLink = linkedId !== null && !busy && !error && !selected;
  const openCount = sessions.filter((s) => s.status === "open" && s.seatsRemaining > 0).length;
  const head = busy || error ? `${C.head.seats} · ${C.head.cadence}` : `${C.head.open(openCount)} · ${C.head.seats}`;

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
      <section className="lg:col-span-7" aria-labelledby="classes-title">
        <div className="max-w-[720px]">
          <Eyebrow className="mb-4">{head}</Eyebrow>
          <h1 id="classes-title" className="t-1 max-w-[14em]">
            {C.headline}
          </h1>
          <p className="t-subhead mt-3 max-w-[26em] text-muted">{C.subhead}</p>
        </div>

        {/* The day filter, one mono label and one well. */}
        <div className="mt-10 flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="w-full max-w-[240px]">
            <label htmlFor={`${uid}-date`} className={labelCls}>
              {C.filter.label}
            </label>
            <input
              id={`${uid}-date`}
              aria-label={C.filter.label}
              type="date"
              value={activeDate}
              onChange={(e) => {
                setDate(e.target.value);
                router.replace("/training/classes", { scroll: false });
              }}
              className={cn(field, "tabular font-mono text-[0.9375rem]")}
            />
          </div>
          {activeDate && (
            <button type="button" onClick={() => setDate("")} className="link-arrow pb-2.5">
              {C.filter.clear}
            </button>
          )}
        </div>

        {error && (
          <Notice tone="error">
            {error}{" "}
            <button type="button" className="underline underline-offset-4" onClick={() => void load()}>
              {C.errors.retry}
            </button>
          </Notice>
        )}
        {unavailableLink && (
          <Notice tone="error">
            {C.errors.unavailable}{" "}
            <Link className="underline underline-offset-4" href="/training/classes" onClick={() => setDate("")}>
              {C.errors.unavailableLink}
            </Link>
          </Notice>
        )}

        {busy ? (
          <ul className="hairline mt-10 border-t" aria-busy="true" aria-label={C.loading}>
            {[1, 2, 3].map((n) => (
              <li key={n} className="hairline border-b py-5">
                <div className="h-4 w-40 animate-pulse rounded bg-paper-3" />
                <div className="mt-3 h-7 w-72 max-w-full animate-pulse rounded bg-paper-3" />
              </li>
            ))}
          </ul>
        ) : sessions.length === 0 ? (
          <div className="hairline mt-10 border-t pt-8">
            <h2 className="t-3">{activeDate ? C.empty.day.headline : C.empty.all.headline}</h2>
            <p className="t-body mt-2 max-w-[34em] text-ink-muted">{activeDate ? C.empty.day.body : C.empty.all.body}</p>
          </div>
        ) : (
          <ul className="hairline mt-10 border-t" aria-label="Class dates">
            {sessions.map((s) => {
              const active = selected?.id === s.id;
              return (
                <li key={s.id} className="hairline border-b">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => router.replace(`/training/classes?session=${s.id}`, { scroll: false })}
                    className="group grid w-full grid-cols-[1rem_minmax(0,1fr)] gap-x-3 py-5 text-left transition-colors duration-200 sm:grid-cols-[1rem_minmax(0,1fr)_auto] sm:gap-x-4 sm:py-6"
                  >
                    {/* One gold mark for the chosen date, the List Rows dot. */}
                    <span aria-hidden="true" className="flex w-4 justify-center pt-[0.45em]">
                      <span className={cn("block h-1.5 w-1.5 rounded-full transition-opacity duration-200", active ? "bg-accent-deep opacity-100" : "bg-accent-deep opacity-0 group-hover:opacity-40")} />
                    </span>
                    <span className="min-w-0">
                      <span className="tabular block font-mono text-[0.8125rem] leading-[1.6] text-ink-muted">{classDateRange(s)}</span>
                      <h2 className={cn("t-3 mt-1.5 transition-colors duration-200", active ? "text-ink" : "text-ink group-hover:text-accent-deep")}>{s.title}</h2>
                      <span className="t-caption mt-1.5 block text-ink-muted">
                        {s.experienceName}
                        {s.instructor ? ` · with ${s.instructor}` : ""}
                      </span>
                    </span>
                    <span className="col-start-2 mt-3 flex flex-wrap items-baseline gap-x-3 sm:col-start-3 sm:mt-0 sm:block sm:pl-6 sm:text-right">
                      <span className="t-4 tabular block whitespace-nowrap text-ink">{money(s.priceCents)}</span>
                      <span className="tabular block whitespace-nowrap font-mono text-[0.8125rem] leading-[1.6] text-ink-muted">{classAvailability(s)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside className="lg:col-span-5 lg:sticky lg:top-[calc(var(--nav-h)+2rem)] lg:self-start">
        {selected ? (
          <Enroll key={selected.id} session={selected} paymentsEnabled={flags.paymentsEnabled} documentsEnabled={flags.documentsEnabled} router={router} />
        ) : (
          <div className="rounded-card p-6 ring-1 ring-ink/10 sm:p-8">
            <Eyebrow>{C.enroll.eyebrow}</Eyebrow>
            <p className="t-3 mt-4">{C.choose.headline}</p>
            <p className="t-body mt-2 max-w-[30em] text-ink-muted">{C.choose.body}</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function Enroll({ session, paymentsEnabled, documentsEnabled, router }: { session: Session; paymentsEnabled: boolean; documentsEnabled: boolean; router: ReturnType<typeof useRouter> }) {
  const uid = useId();
  const maximum = session.status === "open" && new Date(session.startsAt) > new Date() ? Math.min(session.maxPerBooking, session.seatsRemaining, 20) : 0;
  const [count, setCount] = useState(1);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", ack: false, consent: false });
  const [address, setAddress] = useState<Address>(initialAddress);
  const [attendees, setAttendees] = useState([{ firstName: "", lastName: "" }]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const unavailable = !maximum || (session.priceCents > 0 && !paymentsEnabled) || (session.collectId && !documentsEnabled);
  const E = C.enroll;

  const changeCount = (n: number) => {
    const safe = Math.max(1, Math.min(maximum || 1, n));
    setCount(safe);
    setAttendees((a) => Array.from({ length: safe }, (_, i) => a[i] || { firstName: i === 0 ? form.firstName : "", lastName: i === 0 ? form.lastName : "" }));
    setFiles((f) => f.slice(0, safe));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (session.collectId && files.length !== count) return setError(E.errors.idCount);
    if (files.reduce((n, f) => n + f.size, 0) > 8 * 1024 * 1024) return setError(E.errors.idTotal);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("payload", JSON.stringify({ sessionId: session.id, ...form, mailingAddress: address, attendees, ackRequirements: form.ack, documentConsent: form.consent }));
      files.forEach((f, i) => fd.append(`document_${i}`, f));
      const r = await fetch("/api/classes/enroll", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok || !d.redirectUrl) throw new Error(d.error || E.errors.generic);
      if (d.redirectUrl.startsWith("http")) window.location.assign(d.redirectUrl);
      else router.push(d.redirectUrl);
    } catch (x) {
      setError(x instanceof Error ? x.message : E.errors.generic);
      setSaving(false);
    }
  };

  const addressLabel: Record<keyof Address, string> = { line1: L.line1, line2: L.line2, city: L.city, state: L.state, postalCode: L.postalCode, country: L.country };

  return (
    <form onSubmit={submit} className="rounded-card bg-paper-2 p-6 ring-1 ring-ink/10 sm:p-8">
      <Eyebrow>{E.eyebrow}</Eyebrow>
      <h2 className="t-3 mt-4">{session.title}</h2>
      <p className="tabular mt-2 font-mono text-[0.8125rem] leading-[1.6] text-ink-muted">
        {classDateRange(session)} · {money(session.priceCents)}
      </p>
      <p className="t-body mt-5 max-w-[34em] whitespace-pre-line text-ink-muted">{session.requirements}</p>

      {session.priceCents > 0 && !paymentsEnabled && <Notice tone="error">{E.notices.payments}</Notice>}
      {session.collectId && !documentsEnabled && <Notice tone="error">{E.notices.documents}</Notice>}
      {!maximum && <Notice tone="error">{session.status !== "open" || new Date(session.startsAt) <= new Date() ? E.notices.closed : E.notices.soldOut}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-seats`} className={labelCls}>
            {L.seats}
          </label>
          <input id={`${uid}-seats`} type="number" min="1" max={maximum} value={count} onChange={(e) => changeCount(Number(e.target.value))} className={cn(field, "tabular w-24")} />
        </div>
        <div className="hidden sm:block" aria-hidden="true" />
        <Text
          id={`${uid}-first`}
          label={L.firstName}
          value={form.firstName}
          onChange={(v) => {
            setForm({ ...form, firstName: v });
            setAttendees((a) => a.map((x, i) => (i ? x : { ...x, firstName: v })));
          }}
          required
        />
        <Text
          id={`${uid}-last`}
          label={L.lastName}
          value={form.lastName}
          onChange={(v) => {
            setForm({ ...form, lastName: v });
            setAttendees((a) => a.map((x, i) => (i ? x : { ...x, lastName: v })));
          }}
          required
        />
        <Text id={`${uid}-email`} label={L.email} type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Text id={`${uid}-phone`} label={L.phone} type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
      </div>

      <fieldset className="mt-8">
        <legend className={legendCls}>{L.address}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {ADDRESS_KEYS.map((k) => (
            <Text key={k} id={`${uid}-${k}`} label={addressLabel[k]} value={address[k]} required={k !== "line2"} onChange={(v) => setAddress({ ...address, [k]: v })} className={k === "line1" || k === "line2" ? "sm:col-span-2" : undefined} />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className={legendCls}>{L.attendees}</legend>
        <div className="space-y-5">
          {attendees.map((a, i) => (
            <div className="grid gap-5 sm:grid-cols-2" key={i}>
              <Text id={`${uid}-a${i}-first`} label={L.attendeeFirst(i + 1)} value={a.firstName} required onChange={(v) => setAttendees(attendees.map((x, n) => (n === i ? { ...x, firstName: v } : x)))} />
              <Text id={`${uid}-a${i}-last`} label={L.attendeeLast(i + 1)} value={a.lastName} required onChange={(v) => setAttendees(attendees.map((x, n) => (n === i ? { ...x, lastName: v } : x)))} />
              {session.collectId && (
                <div className="sm:col-span-2">
                  <label htmlFor={`${uid}-a${i}-id`} className={labelCls}>
                    {L.photoId(i + 1)}
                  </label>
                  <input
                    id={`${uid}-a${i}-id`}
                    required
                    accept="image/jpeg,image/png"
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && f.size > 2 * 1024 * 1024) {
                        setError(E.errors.idSize);
                        return;
                      }
                      setFiles((old) => {
                        const next = [...old];
                        if (f) next[i] = f;
                        return next;
                      });
                    }}
                    className="block w-full font-mono text-[0.8125rem] text-ink-muted file:mr-3 file:rounded-pill file:border-0 file:bg-ink file:px-4 file:py-1.5 file:font-sans file:text-[0.875rem] file:font-medium file:text-snow"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </fieldset>

      {session.collectId && (
        <div className="hairline mt-8 border-t pt-5">
          <p className="t-footnote max-w-[40em] text-ink-muted">{E.idNote}</p>
          <Check label={L.consent} checked={form.consent} onChange={(v) => setForm({ ...form, consent: v })} />
        </div>
      )}
      <Check label={L.ack} checked={form.ack} onChange={(v) => setForm({ ...form, ack: v })} />

      <div className="mt-8">
        <Button type="submit" size="lg" disabled={unavailable || saving || !form.ack || (session.collectId && !form.consent)} className="w-full">
          {saving ? L.sending : session.priceCents > 0 ? L.submitPaid : L.submitFree}
        </Button>
      </div>
    </form>
  );
}

function Text({ id, label, value, onChange, required, type = "text", className }: { id: string; label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <input id={id} type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className={field} />
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="mt-5 flex cursor-pointer items-start gap-3 text-[0.9375rem] text-ink-muted">
      <input required type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#7f6430]" />
      <span>{label}</span>
    </label>
  );
}

/** One line of news for the reader, error or not: the desk's voice, no colored box. */
export function Notice({ children, tone }: { children: React.ReactNode; tone: "error" | "info" }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={cn("mt-6 border-l-2 py-1 pl-4 text-[0.9375rem] leading-[1.5]", tone === "error" ? "border-danger text-ink" : "border-accent-deep text-ink-muted")}>
      {children}
    </p>
  );
}
