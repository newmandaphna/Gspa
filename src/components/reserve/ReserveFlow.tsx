"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Calendar } from "@/components/reserve/Calendar";
import { Button } from "@/components/ui/Button";
import { Row as ListRow, Rows } from "@/components/ui/List";
import { CATEGORY_LABELS, ELIGIBILITY_LABELS, type CatalogItem, type Category } from "@/lib/content/catalog";
import { ACK_SUMMARY, CANCELLATION_POLICY, requirementsFor } from "@/lib/content/requirements";
import { BOOKING, TIER_WINDOW_DAYS, windowDaysFor } from "@/lib/config/site";
import { computeAmount, maxBookableDate } from "@/lib/availability";
import { formatDateLong, formatMoney, isHHMM, isIsoDate, todayIso } from "@/lib/time";
import { cn } from "@/lib/cn";

type SlotDto = { time: string; label: string; available: number; startsAt: string };
type AvailabilityDto = {
  date: string;
  open: boolean;
  hours: { open: string; close: string } | null;
  slots: SlotDto[];
  reason?: "closed" | "past" | "too_far";
};

export type MemberInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  memberNumber: string;
  tier: string;
  tierName: string;
};

type Props = { experiences: CatalogItem[]; stripeEnabled: boolean; member?: MemberInfo | null };

const STEPS = ["Experience", "Date & time", "Details"] as const;

function durationLabel(min: number) {
  if (min % 60 === 0) return `${min / 60} hr${min / 60 === 1 ? "" : "s"}`;
  return `${min} min`;
}
function unitNoun(item: CatalogItem, n: number) {
  const base =
    item.category === "training" ? "seat" : item.category === "suite" ? "suite" : item.category === "experience" ? "bay" : item.category === "service" ? "appointment" : "lane";
  return `${n} ${base}${n === 1 ? "" : "s"}`;
}

export function ReserveFlow({ experiences, stripeEnabled, member = null }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const bookable = useMemo(() => experiences.filter((e) => e.bookable), [experiences]);
  const categories = useMemo(() => {
    const seen: Category[] = [];
    for (const e of bookable) if (!seen.includes(e.category)) seen.push(e.category);
    return seen;
  }, [bookable]);

  const initialSlug = params.get("experience");
  const initialCategory = params.get("category") as Category | null;
  const initialDate = params.get("date");
  const initialTime = params.get("time");
  const cancelledCode = params.get("cancelled");

  const [category, setCategory] = useState<Category>(() => {
    if (initialSlug) {
      const f = bookable.find((e) => e.slug === initialSlug);
      if (f) return f.category;
    }
    if (initialCategory && categories.includes(initialCategory)) return initialCategory;
    return categories[0] ?? "lane";
  });
  const [experience, setExperience] = useState<CatalogItem | null>(() => bookable.find((e) => e.slug === initialSlug) ?? null);
  const [step, setStep] = useState<0 | 1 | 2>(() => (initialSlug && bookable.some((e) => e.slug === initialSlug) ? 1 : 0));
  const [date, setDate] = useState<string | null>(() => (initialDate && isIsoDate(initialDate) ? initialDate : null));
  const [time, setTime] = useState<string | null>(() => (initialTime && isHHMM(initialTime) ? initialTime : null));
  const [guests, setGuests] = useState(2);
  const [memberNumber, setMemberNumber] = useState("");
  const [availability, setAvailability] = useState<AvailabilityDto | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() => ({
    firstName: member?.firstName ?? "",
    lastName: member?.lastName ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    notes: "",
    ack: false,
  }));
  const topRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => todayIso(), []);
  const typedMember = memberNumber.trim();
  // A typed member number opens the calendar optimistically; the server enforces the real tier window.
  const windowTier = member?.tier ?? (typedMember ? "founders" : null);
  const maxDate = useMemo(() => maxBookableDate(today, windowTier), [today, windowTier]);

  const unitPriceFor = useCallback((item: CatalogItem) => (member && item.memberPriceCents != null ? item.memberPriceCents : item.priceCents), [member]);
  const maxGuestsFor = (item: CatalogItem) => Math.min(BOOKING.maxGuests, item.fixedUnits ? item.maxGuestsPerUnit : item.maxGuestsPerUnit * item.maxUnitsPerBooking);

  const pricing = experience ? computeAmount(experience, guests, Boolean(member)) : { units: 1, unitPriceCents: 0, amountCents: 0 };
  const units = pricing.units;
  const maxGuestsForExperience = experience ? maxGuestsFor(experience) : BOOKING.maxGuests;
  const unitPrice = pricing.unitPriceCents;
  const total = pricing.amountCents;

  const loadSlots = useCallback(async (slug: string, iso: string, typed: string) => {
    setLoadingSlots(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ experience: slug, date: iso });
      if (typed) qs.set("memberNumber", typed);
      const res = await fetch(`/api/availability?${qs.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? "Could not load availability");
      setAvailability((await res.json()) as AvailabilityDto);
    } catch (e) {
      setAvailability(null);
      setError(e instanceof Error ? e.message : "Could not load availability");
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const selectDate = (d: string) => {
    setDate(d);
    setTime(null);
    if (experience) void loadSlots(experience.slug, d, typedMember);
  };

  // Deep links (?experience=&date=&time=) arrive with a date already chosen: load its slots once on mount.
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current) return;
    deepLinked.current = true;
    const slug = experience?.slug;
    const d = date;
    if (slug && d) queueMicrotask(() => void loadSlots(slug, d, ""));
  }, [experience, date, loadSlots]);

  /** Re-query availability after the member number changes (window may widen). */
  const commitMemberNumber = () => {
    if (experience && date) void loadSlots(experience.slug, date, typedMember);
  };

  const goTo = (s: 0 | 1 | 2) => {
    setStep(s);
    setError(null);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const chooseExperience = (e: CatalogItem) => {
    setExperience(e);
    setTime(null);
    setAvailability(null);
    const cap = maxGuestsFor(e);
    if (guests > cap) setGuests(cap);
    if (date) void loadSlots(e.slug, date, typedMember);
    goTo(1);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!experience || !date || !time) return;
    if (!form.ack) {
      setError("Please acknowledge the range requirements to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          experienceSlug: experience.slug,
          date,
          time,
          guests,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          memberNumber: member ? "" : typedMember,
          notes: form.notes || "",
          ackRequirements: true,
        }),
      });
      const data = (await res.json()) as { redirectUrl?: string; error?: string; code?: string };
      if (!res.ok || !data.redirectUrl) {
        setError(data.error ?? "Something went wrong. Please try again.");
        if (res.status === 409) {
          setTime(null);
          goTo(1);
          void loadSlots(experience.slug, date, typedMember);
        }
        setSubmitting(false);
        return;
      }
      if (data.redirectUrl.startsWith("http")) window.location.assign(data.redirectUrl);
      else router.push(data.redirectUrl);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const selectedSlot = availability?.slots.find((s) => s.time === time) ?? null;

  return (
    <div ref={topRef} className="scroll-mt-24">
      {member ? (
        <p className="t-caption mb-6 inline-flex items-center gap-2 rounded-pill bg-night px-3.5 py-1.5 text-snow">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-2" aria-hidden="true" />
          Signed in as {member.firstName} · {member.tierName} member ·{" "}
          <Link href="/members" className="underline underline-offset-2">
            Dashboard
          </Link>
        </p>
      ) : (
        <p className="t-caption mb-6 text-ink-muted">
          Member?{" "}
          <Link href="/members/login?next=/reserve" className="text-link-ink underline underline-offset-2">
            Sign in
          </Link>{" "}
          for member rates, a longer booking window, and members-only services.
        </p>
      )}

      {cancelledCode && step === 0 && (
        <div className="mb-8 rounded-card-sm bg-paper-2 px-5 py-4 t-body text-ink">
          Payment for reservation <span className="font-mono">{cancelledCode}</span> wasn&apos;t completed. Your hold is released automatically after {BOOKING.pendingHoldMin} minutes, and you can start again below.
        </div>
      )}

      {/* Progress */}
      <ol className="mb-10 flex items-center gap-2 sm:gap-4" aria-label="Reservation steps">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                disabled={i > step || (i === 1 && !experience)}
                onClick={() => goTo(i as 0 | 1 | 2)}
                className={cn("flex items-center gap-2 rounded-full text-[0.9375rem] transition-opacity", active ? "opacity-100" : "opacity-60 hover:opacity-100 disabled:hover:opacity-60")}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-[0.8125rem] font-semibold ring-1 ring-inset",
                    active ? "bg-ink text-snow ring-ink" : done ? "bg-ink/10 text-ink ring-transparent" : "text-ink-faint ring-ink/20",
                  )}
                >
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={cn("hidden sm:inline", active && "font-semibold")}>{label}</span>
              </button>
              {i < STEPS.length - 1 && <span className="h-px w-6 bg-ink/15 sm:w-10" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-16">
        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <h2 className="t-2">What would you like to do?</h2>
                <div className="no-scrollbar mt-6 flex gap-1 overflow-x-auto rounded-pill bg-paper-2 p-1" role="tablist" aria-label="Experience type">
                  {categories.map((c) => (
                    <button
                      key={c}
                      role="tab"
                      aria-selected={category === c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={cn(
                        "shrink-0 rounded-pill px-4 py-2 text-[0.9375rem] font-medium transition-[background-color,box-shadow,color] duration-200",
                        category === c ? "bg-white text-ink shadow-[0_1px_4px_rgba(0,0,0,.12)]" : "text-ink-muted hover:text-ink",
                      )}
                    >
                      {CATEGORY_LABELS[c]}
                    </button>
                  ))}
                </div>
                {!member && (category === "lane" || category === "suite") && (
                  <p className="t-caption mt-4 text-ink-muted">
                    No NYC pistol license? Start with{" "}
                    <button type="button" className="text-link-ink underline underline-offset-2" onClick={() => setCategory("experience")}>
                      the simulator
                    </button>{" "}
                    or{" "}
                    <button type="button" className="text-link-ink underline underline-offset-2" onClick={() => setCategory("training")}>
                      First Session
                    </button>
                    .{" "}
                    <Link href="/visit#requirements" className="underline underline-offset-2">
                      See requirements
                    </Link>
                  </p>
                )}
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {bookable
                    .filter((e) => e.category === category)
                    .map((e) => {
                      const price = unitPriceFor(e);
                      const discounted = member && e.memberPriceCents != null && e.memberPriceCents < e.priceCents;
                      return (
                        <li key={e.slug}>
                          <button
                            type="button"
                            onClick={() => chooseExperience(e)}
                            className={cn(
                              "group flex h-full w-full flex-col rounded-card bg-white p-6 text-left ring-1 ring-ink/8 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-apple)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,.08),0_24px_48px_rgba(0,0,0,.10)]",
                              experience?.slug === e.slug && "ring-2 ring-ink",
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <span className="t-caption font-semibold text-accent-deep">{durationLabel(e.durationMin)}</span>
                              {e.memberOnly && <span className="t-footnote rounded-pill bg-night px-2 py-0.5 font-semibold text-snow">Members</span>}
                            </span>
                            <span className="t-3 mt-1">{e.name}</span>
                            <span className="t-body mt-2 text-ink-muted">{e.tagline}</span>
                            <span className="t-footnote mt-3 inline-flex w-fit rounded-pill bg-paper-2 px-2 py-0.5 text-ink-muted">{ELIGIBILITY_LABELS[e.eligibility]}</span>
                            <span className="mt-auto flex items-end justify-between gap-3 pt-6">
                              <span className="t-4">
                                {price === 0 ? "Included" : formatMoney(price)}
                                {price > 0 && <span className="t-caption font-normal text-ink-muted"> / {unitNoun(e, 1).replace(/^1 /, "")}</span>}
                                {discounted && <span className="t-caption ml-2 font-normal text-ink-faint line-through">{formatMoney(e.priceCents)}</span>}
                                {!member && e.memberPriceCents != null && e.memberPriceCents < e.priceCents && (
                                  <span className="t-footnote block font-normal text-ink-muted">Members {e.memberPriceCents === 0 ? "included" : formatMoney(e.memberPriceCents)}</span>
                                )}
                              </span>
                              <span className="t-caption text-right text-ink-muted">
                                {e.fixedUnits ? `up to ${e.maxGuestsPerUnit} guests · flat` : e.maxGuestsPerUnit > 1 ? `up to ${e.maxGuestsPerUnit} guests` : "per guest"}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </motion.div>
            )}

            {step === 1 && experience && (
              <motion.div key="s1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <h2 className="t-2">When?</h2>
                <p className="t-body mt-2 text-ink-muted">
                  {experience.name} · {durationLabel(experience.durationMin)}.{" "}
                  {member
                    ? `${member.tierName} members reserve up to ${windowDaysFor(member.tier)} days ahead.`
                    : `Public reservations open ${BOOKING.maxAdvanceDays} days out; members see ${TIER_WINDOW_DAYS.club}, ${TIER_WINDOW_DAYS.signature} or ${TIER_WINDOW_DAYS.founders}.`}
                </p>

                <div className="mt-8 grid gap-10 md:grid-cols-2">
                  <div>
                    <Calendar value={date} onChange={selectDate} minDate={today} maxDate={maxDate} />
                  </div>
                  <div>
                    <div className="mb-6">
                      <label className="t-caption font-semibold text-ink" htmlFor="guests">
                        Guests
                      </label>
                      <div className="mt-2 flex items-center gap-3">
                        <button type="button" aria-label="Fewer guests" onClick={() => setGuests((g) => Math.max(1, g - 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-2 text-xl transition-colors hover:bg-paper-3">
                          −
                        </button>
                        <input
                          id="guests"
                          type="number"
                          min={1}
                          max={maxGuestsForExperience}
                          value={guests}
                          onChange={(e) => setGuests(Math.max(1, Math.min(maxGuestsForExperience, Number(e.target.value) || 1)))}
                          className="h-10 w-16 rounded-lg bg-white text-center text-[1.0625rem] ring-1 ring-inset ring-ink/15 focus:ring-ink"
                        />
                        <button type="button" aria-label="More guests" onClick={() => setGuests((g) => Math.min(maxGuestsForExperience, g + 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-2 text-xl transition-colors hover:bg-paper-3">
                          +
                        </button>
                        <span className="t-caption text-ink-muted">
                          {unitNoun(experience, units)} · max {maxGuestsForExperience}
                        </span>
                      </div>
                    </div>

                    {!member && (
                      <div className="mb-6">
                        <label className="t-caption font-semibold text-ink" htmlFor="member">
                          Member number <span className="font-normal text-ink-muted">(optional)</span>
                        </label>
                        <input
                          id="member"
                          value={memberNumber}
                          onChange={(e) => setMemberNumber(e.target.value)}
                          onBlur={commitMemberNumber}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitMemberNumber();
                            }
                          }}
                          placeholder="GS-M-1001"
                          className="mt-2 h-11 w-full rounded-xl bg-white px-4 font-mono text-[1rem] uppercase ring-1 ring-inset ring-ink/15 placeholder:text-ink-faint focus:ring-ink"
                        />
                        <p className="t-footnote mt-1 text-ink-faint">
                          Extends your booking window.{" "}
                          <Link href="/members/login?next=/reserve" className="underline underline-offset-2">
                            Sign in
                          </Link>{" "}
                          for member rates.
                        </p>
                      </div>
                    )}

                    <p className="t-caption font-semibold text-ink">Start time</p>
                    <div className="mt-2 min-h-[120px]" aria-live="polite">
                      {!date && <p className="t-body text-ink-faint">Pick a date first.</p>}
                      {date && loadingSlots && (
                        <div className="grid grid-cols-3 gap-2">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="h-11 animate-pulse rounded-xl bg-paper-2" />
                          ))}
                        </div>
                      )}
                      {date && !loadingSlots && availability && !availability.open && (
                        <p className="t-body text-ink-muted">
                          {availability.reason === "closed" ? "We're closed that day." : availability.reason === "too_far" ? "That date isn't open for reservations yet." : "That date has passed."}
                        </p>
                      )}
                      {date && !loadingSlots && availability?.open && availability.slots.length === 0 && (
                        <p className="t-body text-ink-muted">No start times left on {formatDateLong(date)}. Try another day.</p>
                      )}
                      {date && !loadingSlots && availability?.open && availability.slots.length > 0 && (
                        <div className="grid grid-cols-3 gap-2" role="listbox" aria-label="Available start times">
                          {availability.slots.map((s) => {
                            const ok = s.available >= units;
                            const selected = time === s.time;
                            // "N left" only when this slot is scarcer than the day's best, so single-capacity
                            // resources (gunsmith bench, detailing bay) don't badge every slot.
                            const scarce = ok && s.available <= 2 && s.available < Math.max(...availability.slots.map((x) => x.available));
                            return (
                              <button
                                key={s.time}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                disabled={!ok}
                                onClick={() => setTime(s.time)}
                                className={cn(
                                  "relative h-11 rounded-xl text-[0.9375rem] font-medium ring-1 ring-inset transition-[background-color,color,box-shadow] duration-200",
                                  selected ? "bg-ink text-snow ring-ink" : ok ? "bg-white text-ink ring-ink/15 hover:ring-ink/40" : "bg-paper-2 text-ink/30 ring-transparent line-through",
                                )}
                              >
                                {s.label}
                                {scarce && !selected && (
                                  <span className="absolute -top-1.5 right-2 rounded-pill bg-accent px-1.5 text-[0.625rem] font-semibold text-night">{s.available} left</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <Button onClick={() => goTo(2)} disabled={!date || !time}>
                    Continue
                  </Button>
                  <Button variant="link" onClick={() => goTo(0)}>
                    Change experience
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && experience && date && time && (
              <motion.form key="s2" onSubmit={submit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <h2 className="t-2">{member ? "Confirm your details." : "Who's coming?"}</h2>
                <p className="t-body mt-2 text-ink-muted">We&apos;ll send the confirmation and a check-in link to this email.</p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <Field label="First name" id="firstName" autoComplete="given-name" required value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
                  <Field label="Last name" id="lastName" autoComplete="family-name" required value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
                  <Field label="Email" id="email" type="email" autoComplete="email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                  <Field label="Phone" id="phone" type="tel" autoComplete="tel" required value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                  <div className="sm:col-span-2">
                    <label htmlFor="notes" className="t-caption font-semibold text-ink">
                      Anything we should know? <span className="font-normal text-ink-muted">(optional)</span>
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      maxLength={500}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="First time shooting, celebrating a birthday, bringing your own long gun…"
                      className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-[1.0625rem] ring-1 ring-inset ring-ink/15 placeholder:text-ink-faint focus:ring-ink"
                    />
                  </div>
                </div>

                <div className="mt-8 rounded-card-sm bg-paper-2 p-5">
                  <p className="t-caption font-semibold text-ink">Before you arrive</p>
                  <Rows mark="dot" size="sm" className="mt-3">
                    {requirementsFor(experience.eligibility, Boolean(member))
                      .slice(0, 5)
                      .map((r) => (
                        <ListRow key={r.text} tone="muted">
                          {r.text}
                        </ListRow>
                      ))}
                  </Rows>
                  <Link href="/visit#requirements" className="link-arrow mt-4 text-[0.875rem]">
                    All requirements
                  </Link>
                  <label className="mt-4 flex cursor-pointer items-start gap-3">
                    <input type="checkbox" required checked={form.ack} onChange={(e) => setForm({ ...form, ack: e.target.checked })} className="mt-1 h-5 w-5 shrink-0 accent-ink" />
                    <span className="t-caption text-ink">{ACK_SUMMARY}</span>
                  </label>
                  <p className="t-footnote mt-3 text-ink-faint">{CANCELLATION_POLICY}</p>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={submitting} size="lg">
                    {submitting ? "One moment…" : total === 0 ? "Confirm reservation" : stripeEnabled ? `Continue to payment · ${formatMoney(total)}` : "Confirm reservation"}
                  </Button>
                  <Button variant="link" onClick={() => goTo(1)}>
                    Back
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {error && (
            <p role="alert" className="t-body mt-6 rounded-xl bg-[#fff2f0] px-4 py-3 text-[#c0392b]">
              {error}
            </p>
          )}
        </div>

        {/* Summary rail */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card bg-white p-6 ring-1 ring-ink/8 shadow-[var(--shadow-card)]">
            <p className="t-eyebrow text-ink-faint">Your reservation</p>
            {experience ? (
              <>
                <p className="t-3 mt-3">{experience.name}</p>
                <dl className="mt-4 space-y-2 t-body">
                  <Row label="Date" value={date ? formatDateLong(date) : "Choose a day"} />
                  <Row label="Time" value={selectedSlot ? `${selectedSlot.label} · ${durationLabel(experience.durationMin)}` : (time ?? "Choose a time")} />
                  <Row label="Guests" value={`${guests} · ${unitNoun(experience, units)}`} />
                  {member && <Row label="Member" value={member.memberNumber} />}
                  {!member && typedMember && <Row label="Member no." value={typedMember.toUpperCase()} />}
                </dl>
                <div className="mt-5 border-t border-ink/10 pt-4">
                  <Row label="Total" value={total === 0 ? "Included" : formatMoney(total)} strong />
                  <p className="t-footnote mt-1 text-ink-faint">
                    {total === 0 ? "Included with your membership. " : stripeEnabled ? "Charged securely at checkout. " : "Pay at the front desk on arrival. "}
                    {unitPrice > 0 &&
                      (experience.fixedUnits
                        ? `${formatMoney(unitPrice)} flat${member && experience.memberPriceCents != null && experience.memberPriceCents < experience.priceCents ? " at the member rate" : ""}. Tax included.`
                        : `${formatMoney(unitPrice)} per ${unitNoun(experience, 1).replace(/^1 /, "")}${experience.extraGuestCents ? `, ${formatMoney(experience.extraGuestCents)} per additional guest` : ""}${member && experience.memberPriceCents != null && experience.memberPriceCents < experience.priceCents ? " at the member rate" : ""}. Tax included.`)}
                  </p>
                </div>
              </>
            ) : (
              <p className="t-body mt-3 text-ink-muted">Choose an experience to begin.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={cn("text-right", strong && "t-4")}>{value}</dd>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="t-caption font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-xl bg-white px-4 text-[1.0625rem] ring-1 ring-inset ring-ink/15 focus:ring-ink"
      />
    </div>
  );
}
