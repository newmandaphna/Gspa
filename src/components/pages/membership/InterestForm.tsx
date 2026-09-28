"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { INTEREST_FORM, LIST_LICENSE_OPTIONS, type ListLicenseOption } from "@/lib/content/pages/membership";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; id: number | string } | { kind: "error"; message: string };

const field =
  "h-11 w-full rounded-[3px] bg-white/[0.07] px-4 text-[1.0625rem] text-snow ring-1 ring-inset ring-white/15 placeholder:text-mist/70 transition-[box-shadow,background-color] duration-200 focus:bg-white/[0.1] focus:ring-accent focus:outline-none";
const label = "t-label mb-2 block text-mist";

/**
 * The membership list before opening. Posts to /api/inquiries (kind "membership")
 * with the ZIP code and license status in the message. No references, no
 * screening consent and no fee: those wait for the owner's final membership terms.
 * The ZIP code, not a street address, is enough to measure interest by area.
 */
export function InterestForm({ className, idPrefix = "i" }: { className?: string; idPrefix?: string }) {
  const L = INTEREST_FORM.labels;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [license, setLicense] = useState<ListLicenseOption | "">("");
  const [heard, setHeard] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) {
      setStatus({ kind: "error", message: INTEREST_FORM.errors.consent });
      return;
    }
    if (!/^\d{5}$/.test(zip.trim())) {
      setStatus({ kind: "error", message: INTEREST_FORM.errors.zip });
      return;
    }
    if (!license) {
      setStatus({ kind: "error", message: INTEREST_FORM.errors.license });
      return;
    }
    setStatus({ kind: "sending" });
    const message = [`Membership list (pre-opening)`, `ZIP: ${zip.trim()}`, `NYC pistol license: ${license}`, `Heard via: ${heard || "not said"}`].join("\n");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "membership", name, email, phone, message, website }),
      });
      const data = (await res.json()) as { ok?: boolean; id?: number | string; error?: string };
      if (!res.ok || !data.ok || data.id === undefined) {
        setStatus({ kind: "error", message: data.error ?? INTEREST_FORM.errors.generic });
        return;
      }
      setStatus({ kind: "sent", id: data.id });
    } catch {
      setStatus({ kind: "error", message: INTEREST_FORM.errors.generic });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className={cn("rounded-card p-8 ring-1 ring-white/15 sm:p-12", className)} role="status" aria-live="polite">
        <p className="t-3 text-accent">{INTEREST_FORM.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn("relative rounded-card p-6 ring-1 ring-white/15 sm:p-10", className)}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${idPrefix}-name`} className={label}>
            {L.name}
          </label>
          <input id={`${idPrefix}-name`} name="name" autoComplete="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-email`} className={label}>
            {L.email}
          </label>
          <input id={`${idPrefix}-email`} name="email" type="email" autoComplete="email" required maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-phone`} className={label}>
            {L.phone}
          </label>
          <input id={`${idPrefix}-phone`} name="phone" type="tel" autoComplete="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-zip`} className={label}>
            {L.zip}
          </label>
          <input
            id={`${idPrefix}-zip`}
            name="zip"
            inputMode="numeric"
            autoComplete="postal-code"
            required
            pattern="[0-9]{5}"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
            className={field}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-license`} className={label}>
            {L.license}
          </label>
          <select id={`${idPrefix}-license`} name="license" required value={license} onChange={(e) => setLicense(e.target.value as ListLicenseOption)} className={cn(field, "appearance-none")}>
            <option value="" disabled className="text-ink">
              {L.licensePlaceholder}
            </option>
            {LIST_LICENSE_OPTIONS.map((o) => (
              <option key={o} value={o} className="text-ink">
                {o}
              </option>
            ))}
          </select>
        </div>
        <p className="t-caption -mt-3 text-mist sm:col-span-2">{L.licenseNote}</p>
        <div className="sm:col-span-2">
          <label htmlFor={`${idPrefix}-heard`} className={label}>
            {L.heard}
          </label>
          <select id={`${idPrefix}-heard`} name="heard" value={heard} onChange={(e) => setHeard(e.target.value)} className={cn(field, "appearance-none")}>
            <option value="" className="text-ink">
              Choose one
            </option>
            {INTEREST_FORM.heardOptions.map((o) => (
              <option key={o} value={o} className="text-ink">
                {o}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] text-mist">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#c9a55a]" required />
            <span>
              {L.consentPrefix}{" "}
              <Link href="/legal#privacy" className="text-accent-2 underline underline-offset-4 hover:text-snow">
                {L.consentPrivacy}
              </Link>
              .
            </span>
          </label>
        </div>

        {/* Honeypot: real people never see or fill this. */}
        <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor={`${idPrefix}-website`}>Website</label>
          <input id={`${idPrefix}-website`} name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
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
