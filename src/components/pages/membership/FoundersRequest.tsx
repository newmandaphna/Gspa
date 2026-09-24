"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { BEST_TIME_OPTIONS, FOUNDERS_REQUEST, type BestTime } from "@/lib/content/pages/membership";

type Field = "name" | "phone" | "email";
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; id: number | string } | { kind: "error"; message: string; field?: Field };

const field =
  "h-11 w-full rounded-[12px] bg-white/[0.07] px-4 text-[1.0625rem] text-snow ring-1 ring-inset ring-white/15 placeholder:text-mist/70 transition-[box-shadow,background-color] duration-200 focus:bg-white/[0.1] focus:ring-accent focus:outline-none aria-[invalid=true]:ring-accent";
const labelCls = "t-caption mb-2 block font-medium text-mist";

/**
 * "Request a conversation" for Founders. Posts to /api/inquiries with kind
 * "founders"; best time, referrer and the wall opt-in travel in the message
 * as "Key: value" lines so the desk reads them in one place. When the wall
 * is full (`waitlist`) the same form joins the waitlist instead.
 *
 * The wrapper keeps its id in both states so the hero's "#founders-request"
 * link always lands. A live region stays mounted throughout and only its
 * text changes, which is what screen readers announce; on success focus
 * moves to the confirmation line so the keyboard is not dropped at the top
 * of the page when the form goes. A field that fails its check is marked
 * invalid, described by its own message and focused.
 */
export function FoundersRequest({ waitlist = false, className }: { waitlist?: boolean; className?: string }) {
  const uid = useId();
  const f = FOUNDERS_REQUEST;
  const L = f.labels;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bestTime, setBestTime] = useState<BestTime | "">("");
  const [referrer, setReferrer] = useState("");
  const [wallOptIn, setWallOptIn] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inputs = { name: useRef<HTMLInputElement>(null), phone: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null) };
  const successRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (status.kind === "sent") successRef.current?.focus();
    else if (status.kind === "error" && status.field) inputs[status.field].current?.focus();
    // The refs are stable; only the status decides where focus goes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function fail(field: Field, message: string) {
    setStatus({ kind: "error", message, field });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "sending") return;
    if (!name.trim()) return fail("name", f.errors.name);
    if (phone.trim().replace(/\D/g, "").length < 7) return fail("phone", f.errors.phone);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return fail("email", f.errors.email);

    const k = f.messageKeys;
    const v = f.messageValues;
    const message = [
      `${k.request}: ${waitlist ? v.waitlist : v.conversation}`,
      `${k.bestTime}: ${bestTime || v.unspecified}`,
      `${k.referrer}: ${referrer.trim() || v.unspecified}`,
      `${k.wall}: ${wallOptIn ? v.wallYes : v.wallNo}`,
    ].join("\n");

    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "founders", name: name.trim(), email: email.trim(), phone: phone.trim(), message, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: number | string; error?: string };
      if (res.ok && data.ok && data.id !== undefined) {
        setStatus({ kind: "sent", id: data.id });
      } else {
        setStatus({ kind: "error", message: data.error || f.errors.generic });
      }
    } catch {
      setStatus({ kind: "error", message: f.errors.generic });
    }
  }

  const successLine = waitlist ? f.success.lineWaitlist : f.success.line;
  const fieldError = (which: Field) => (status.kind === "error" && status.field === which ? status.message : null);
  const errorId = (which: Field) => `${uid}-${which}-error`;
  const fieldProps = (which: Field) => {
    const message = fieldError(which);
    return {
      ref: inputs[which],
      "aria-invalid": message ? true : undefined,
      "aria-describedby": message ? errorId(which) : undefined,
    };
  };
  const fieldMessage = (which: Field) => {
    const message = fieldError(which);
    return message ? (
      <p id={errorId(which)} className="t-caption mt-2 text-snow">
        {message}
      </p>
    ) : null;
  };

  return (
    <div id="founders-request" className={cn("relative scroll-mt-[var(--nav-h)] rounded-card bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-8", className)}>
      {status.kind === "sent" ? (
        <>
          <p ref={successRef} tabIndex={-1} className="t-3 text-accent outline-none">
            {successLine}
          </p>
          <p className="tabular mt-4 font-mono text-[0.9375rem] text-mist">
            {f.success.reference} #{status.id}
          </p>
        </>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <h3 className="t-3 text-snow">{waitlist ? f.titleWaitlist : f.title}</h3>
          <p className="t-body mt-2 max-w-[34em] text-mist">{waitlist ? f.ledeWaitlist : f.lede}</p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor={`${uid}-name`} className={labelCls}>
                {L.name}
              </label>
              <input id={`${uid}-name`} name="name" autoComplete="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={field} {...fieldProps("name")} />
              {fieldMessage("name")}
            </div>
            <div>
              <label htmlFor={`${uid}-phone`} className={labelCls}>
                {L.phone}
              </label>
              <input id={`${uid}-phone`} name="phone" type="tel" autoComplete="tel" required maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} className={field} {...fieldProps("phone")} />
              {fieldMessage("phone")}
            </div>
            <div>
              <label htmlFor={`${uid}-email`} className={labelCls}>
                {L.email}
              </label>
              <input id={`${uid}-email`} name="email" type="email" autoComplete="email" required maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} className={field} {...fieldProps("email")} />
              {fieldMessage("email")}
            </div>

            <fieldset>
              <legend className={labelCls}>{L.bestTime}</legend>
              <div className="flex flex-wrap gap-2">
                {BEST_TIME_OPTIONS.map((o) => (
                  <label key={o} className="cursor-pointer">
                    <input type="radio" name="bestTime" value={o} checked={bestTime === o} onChange={() => setBestTime(o)} className="peer sr-only" />
                    <span className="inline-flex h-10 items-center rounded-pill px-4 text-[0.9375rem] text-mist ring-1 ring-inset ring-white/20 transition-[background-color,box-shadow,color] duration-200 hover:text-snow peer-checked:bg-snow peer-checked:text-ink peer-checked:ring-snow peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                      {o}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor={`${uid}-ref`} className={labelCls}>
                {L.referrer}
              </label>
              <input id={`${uid}-ref`} name="referrer" maxLength={120} value={referrer} onChange={(e) => setReferrer(e.target.value)} className={field} aria-describedby={`${uid}-ref-hint`} />
              <p id={`${uid}-ref-hint`} className="t-footnote mt-2 text-mist">
                {L.referrerHint}
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] text-mist">
                <input type="checkbox" name="wallOptIn" checked={wallOptIn} onChange={(e) => setWallOptIn(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#c9a55a]" />
                <span>{L.wallOptIn}</span>
              </label>
            </div>

            {/* Honeypot: real people never see or fill this. */}
            <div className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden" aria-hidden="true">
              <label htmlFor={`${uid}-website`}>Website</label>
              <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>

            <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" variant="accent" size="lg" disabled={status.kind === "sending"}>
                {status.kind === "sending" ? L.sending : waitlist ? L.submitWaitlist : L.submit}
              </Button>
              {status.kind === "error" && !status.field && (
                <p role="alert" className="t-caption text-snow">
                  {status.message}
                </p>
              )}
            </div>
          </div>
        </form>
      )}
      {/* Always mounted, so the change of text is what gets announced. */}
      <p role="status" aria-live="polite" className="sr-only">
        {status.kind === "sent" ? `${successLine} ${f.success.reference} #${status.id}.` : status.kind === "error" && status.field ? status.message : ""}
      </p>
    </div>
  );
}
