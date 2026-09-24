"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "@/components/pages/membership/Art";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { APPLY_FORM, HEARD_OPTIONS, LICENSE_OPTIONS, type LicenseOption } from "@/lib/content/pages/membership";

type TierOption = { key: string; name: string; screeningFeeWaived?: boolean };

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; id: number | string } | { kind: "error"; message: string };

const field =
  "h-11 w-full rounded-[12px] bg-white/[0.07] px-4 text-[1.0625rem] text-snow ring-1 ring-inset ring-white/15 placeholder:text-mist/70 transition-[box-shadow,background-color] duration-200 focus:bg-white/[0.1] focus:ring-accent focus:outline-none";
const label = "t-caption mb-2 block font-medium text-mist";

function Segmented<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="inline-flex w-full rounded-pill bg-white/[0.07] p-1 ring-1 ring-inset ring-white/10">
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.key)}
            className={cn(
              "h-9 flex-1 rounded-pill px-3 text-[0.9375rem] font-medium transition-[background-color,color] duration-200 ease-[var(--ease-apple)]",
              selected ? "bg-snow text-ink" : "text-mist hover:text-snow",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Membership application. Posts JSON to /api/inquiries (kind "membership");
 * extra fields travel in the message as "Key: value" lines. The screening
 * fee step is a placeholder until Stripe goes live.
 */
export function ApplyForm({ tiers, initialTier, className }: { tiers: TierOption[]; initialTier?: string; className?: string }) {
  const L = APPLY_FORM.labels;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tier, setTier] = useState<string>(initialTier ?? tiers[0]?.key ?? "");
  const [license, setLicense] = useState<LicenseOption>("None");
  const [ref1, setRef1] = useState("");
  const [ref2, setRef2] = useState("");
  const [heard, setHeard] = useState<string>("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const current = tiers.find((t) => t.key === tier) ?? tiers[0];
  const tierOptions = tiers.map((t) => ({ key: t.key, label: t.name }));
  const licenseOptions = LICENSE_OPTIONS.map((o) => ({ key: o, label: o }));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) {
      setStatus({ kind: "error", message: APPLY_FORM.errors.consent });
      return;
    }
    setStatus({ kind: "sending" });
    const message = [
      `Tier: ${current?.name ?? tier}`,
      `License: ${license}`,
      `References: ${[ref1.trim(), ref2.trim()].filter(Boolean).join("; ") || "none given"}`,
      `Heard via: ${heard || "not said"}`,
      `Screening fee: ${current?.screeningFeeWaived ? "waived" : "due at orientation"}`,
    ].join("\n");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "membership", name, email, phone, message, website }),
      });
      const data = (await res.json()) as { ok?: boolean; id?: number | string; error?: string };
      if (!res.ok || !data.ok || data.id === undefined) {
        setStatus({ kind: "error", message: data.error ?? APPLY_FORM.errors.generic });
        return;
      }
      setStatus({ kind: "sent", id: data.id });
    } catch {
      setStatus({ kind: "error", message: APPLY_FORM.errors.generic });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className={cn("glass-dark rounded-card p-8 ring-1 ring-white/10 sm:p-12", className)} role="status" aria-live="polite">
        <p className="t-3 text-accent">{APPLY_FORM.success.line}</p>
        <p className="tabular mt-4 font-mono text-[0.9375rem] text-mist">
          {APPLY_FORM.success.reference} #{status.id}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn("glass-dark relative rounded-card p-6 ring-1 ring-white/10 sm:p-10", className)}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="m-name" className={label}>
            {L.name}
          </label>
          <input id="m-name" name="name" autoComplete="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="m-email" className={label}>
            {L.email}
          </label>
          <input id="m-email" name="email" type="email" autoComplete="email" required maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="m-phone" className={label}>
            {L.phone}
          </label>
          <input id="m-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
        </div>

        <div>
          <p className={label}>{L.tier}</p>
          <Segmented name={L.tier} options={tierOptions} value={tier} onChange={setTier} />
        </div>
        <div>
          <p className={label}>{L.license}</p>
          <Segmented name={L.license} options={licenseOptions} value={license} onChange={setLicense} />
        </div>

        <div>
          <label htmlFor="m-ref1" className={label}>
            {L.reference1}
          </label>
          <input id="m-ref1" name="reference1" maxLength={200} value={ref1} onChange={(e) => setRef1(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="m-ref2" className={label}>
            {L.reference2}
          </label>
          <input id="m-ref2" name="reference2" maxLength={200} value={ref2} onChange={(e) => setRef2(e.target.value)} className={field} />
        </div>
        <p className="t-footnote -mt-3 text-mist sm:col-span-2">{L.referenceHint}</p>

        <div className="sm:col-span-2">
          <label htmlFor="m-heard" className={label}>
            {L.heard}
          </label>
          <select id="m-heard" name="heard" value={heard} onChange={(e) => setHeard(e.target.value)} className={cn(field, "appearance-none")}>
            <option value="" className="text-ink">
              Choose one
            </option>
            {HEARD_OPTIONS.map((o) => (
              <option key={o} value={o} className="text-ink">
                {o}
              </option>
            ))}
          </select>
        </div>

        {/* Screening fee: a Stripe insertion point until payments go live. */}
        <div className="rounded-[16px] border border-dashed border-accent/60 p-5 sm:col-span-2" aria-live="polite">
          <p className="font-mono text-[0.75rem] uppercase tracking-[0.08em] text-accent">{APPLY_FORM.stripe.label}</p>
          <p className="t-body mt-3 flex items-start gap-2 text-snow">
            {current?.screeningFeeWaived && <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />}
            <span className="tabular">{current?.screeningFeeWaived ? APPLY_FORM.stripe.waived(current.name) : APPLY_FORM.stripe.due}</span>
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] text-mist">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#c9a55a]" required />
            <span>
              {L.consentPrefix}{" "}
              <Link href={APPLY_FORM.links.screening} className="text-accent-2 underline underline-offset-4 hover:text-snow">
                {L.consentScreening}
              </Link>{" "}
              {L.consentAnd}{" "}
              <Link href={APPLY_FORM.links.privacy} className="text-accent-2 underline underline-offset-4 hover:text-snow">
                {L.consentPrivacy}
              </Link>
              {L.consentSuffix}
            </span>
          </label>
        </div>

        {/* Honeypot: real people never see or fill this. */}
        <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="m-website">Website</label>
          <input id="m-website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" variant="accent" size="lg" disabled={status.kind === "sending"}>
            {status.kind === "sending" ? L.sending : L.submit}
          </Button>
          {status.kind === "error" && (
            <p role="alert" className="t-caption text-snow">
              {status.message}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
