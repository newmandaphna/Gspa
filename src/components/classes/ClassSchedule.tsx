"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { usePublicClasses } from "./usePublicClasses";
import { classAvailability, classDateRange, classPrice, type PublicClassSession } from "@/lib/public-classes";

type Session = PublicClassSession;
type Address = { line1: string; line2: string; city: string; state: string; postalCode: string; country: string };
const initialAddress: Address = { line1: "", line2: "", city: "", state: "", postalCode: "", country: "US" };
const money = classPrice;

export function ClassSchedule() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkedId = searchParams.get("session");
  const [date, setDate] = useState("");
  const activeDate = linkedId !== null ? "" : date;
  const { sessions, busy, error, reload: load, ...flags } = usePublicClasses(activeDate);
  const selected = !busy && !error && linkedId !== null && /^[1-9]\d*$/.test(linkedId)
    ? sessions.find(s => s.id === Number(linkedId)) ?? null : null;
  const unavailableLink = linkedId !== null && !busy && !error && !selected;
  return <div className="grid gap-10 lg:grid-cols-[1fr_390px]">
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="t-eyebrow text-accent-deep">Scheduled instruction</p><h1 className="t-1 mt-2">Choose a class date.</h1></div>
        <label className="t-caption font-semibold">Date <input aria-label="Class date" type="date" value={activeDate} onChange={(e) => { setDate(e.target.value); router.replace("/training/classes", { scroll: false }); }} className="ml-2 rounded-lg bg-white px-3 py-2 ring-1 ring-ink/15" /></label>
      </div>
      {error && <Notice tone="error">{error} <button className="underline" onClick={() => void load()}>Try again</button></Notice>}
      {unavailableLink && <Notice tone="error">This class is unavailable. It may no longer be listed or may have already started. <Link className="underline" href="/training/classes" onClick={() => setDate("")}>View full class schedule</Link></Notice>}
      {busy ? <div className="mt-8 space-y-3">{[1,2,3].map((n) => <div key={n} className="h-32 animate-pulse rounded-card bg-paper-2" />)}</div> : sessions.length === 0 ? <div className="mt-8 rounded-card bg-paper-2 p-8"><h2 className="t-3">{date ? "No classes listed for this date." : "New class dates are coming soon."}</h2><p className="t-body mt-2 text-ink-muted">{date ? "Try another date, or clear the date to see all upcoming classes." : "New instruction dates are posted regularly. Contact the front desk for upcoming sessions."}</p></div> :
      <ul className="mt-8 space-y-3">{sessions.map(s => <li key={s.id}><button onClick={() => router.replace(`/training/classes?session=${s.id}`, { scroll: false })} className={`w-full rounded-card bg-white p-5 text-left ring-1 transition hover:ring-ink/40 ${selected?.id === s.id ? "ring-ink" : "ring-ink/10"}`}>
        <div className="flex flex-wrap justify-between gap-3"><div><p className="font-mono text-[.75rem] text-accent-deep">{classDateRange(s)}</p><h2 className="t-3 mt-1">{s.title}</h2><p className="t-caption mt-1 text-ink-muted">{s.experienceName}{s.instructor ? ` · with ${s.instructor}` : ""}</p></div><div className="text-right"><p className="t-4">{money(s.priceCents)}</p><p className="t-caption text-ink-muted">{classAvailability(s)}</p></div></div>
      </button></li>)}</ul>}
    </section>
    <aside className="lg:sticky lg:top-20 lg:self-start">{selected ? <Enroll key={selected.id} session={selected} paymentsEnabled={flags.paymentsEnabled} documentsEnabled={flags.documentsEnabled} router={router} /> : <div className="rounded-card bg-night p-7 text-snow"><p className="t-3">Your seat starts here.</p><p className="t-body mt-3 text-mist">Select a class to see requirements and reserve.</p></div>}</aside>
  </div>;
}

function Enroll({ session, paymentsEnabled, documentsEnabled, router }: { session: Session; paymentsEnabled: boolean; documentsEnabled: boolean; router: ReturnType<typeof useRouter> }) {
  const maximum = session.status === "open" && new Date(session.startsAt) > new Date()
    ? Math.min(session.maxPerBooking, session.seatsRemaining, 20) : 0;
  const [count, setCount] = useState(1); const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", ack: false, consent: false }); const [address, setAddress] = useState<Address>(initialAddress); const [attendees, setAttendees] = useState([{ firstName: "", lastName: "" }]); const [files, setFiles] = useState<File[]>([]); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const unavailable = !maximum || (session.priceCents > 0 && !paymentsEnabled) || (session.collectId && !documentsEnabled);
  const changeCount = (n: number) => { const safe = Math.max(1, Math.min(maximum || 1, n)); setCount(safe); setAttendees(a => Array.from({ length: safe }, (_, i) => a[i] || { firstName: i === 0 ? form.firstName : "", lastName: i === 0 ? form.lastName : "" })); setFiles(f => f.slice(0, safe)); };
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setError(""); if (session.collectId && files.length !== count) return setError("Add one photo ID for each attendee."); if (files.reduce((n, f) => n + f.size, 0) > 8 * 1024 * 1024) return setError("Documents exceed 8 MiB total. Reduce the attendee count or use smaller files."); setSaving(true); try { const fd = new FormData(); fd.append("payload", JSON.stringify({ sessionId: session.id, ...form, mailingAddress: address, attendees, ackRequirements: form.ack, documentConsent: form.consent })); files.forEach((f, i) => fd.append(`document_${i}`, f)); const r = await fetch("/api/classes/enroll", { method: "POST", body: fd }); const d = await r.json(); if (!r.ok || !d.redirectUrl) throw new Error(d.error || "Could not reserve this class."); if (d.redirectUrl.startsWith("http")) window.location.assign(d.redirectUrl); else router.push(d.redirectUrl); } catch (x) { setError(x instanceof Error ? x.message : "Could not reserve this class."); setSaving(false); } };
  return <form onSubmit={submit} className="rounded-card bg-paper-2 p-5 sm:p-6"><p className="t-eyebrow text-accent-deep">Reserve a seat</p><h2 className="t-3 mt-1">{session.title}</h2><p className="t-caption mt-2 text-ink-muted">{classDateRange(session)} · {money(session.priceCents)}</p>
    <p className="t-body mt-5 whitespace-pre-line text-ink-muted">{session.requirements}</p>
    {session.priceCents > 0 && !paymentsEnabled && <Notice tone="error">Online payment is not available for this class right now. Please contact the desk.</Notice>}
    {session.collectId && !documentsEnabled && <Notice tone="error">Secure ID collection is temporarily unavailable. Please contact the desk to book.</Notice>}
    {!maximum && <Notice tone="error">{session.status !== "open" || new Date(session.startsAt) <= new Date() ? "Enrollment is closed for this class." : "This class is sold out."}</Notice>}
    {error && <Notice tone="error">{error}</Notice>}
    <label className="t-caption mt-5 block font-semibold">Seats <input type="number" min="1" max={maximum} value={count} onChange={e => changeCount(Number(e.target.value))} className="ml-2 w-16 rounded-lg bg-white px-2 py-1 ring-1 ring-ink/15" /></label>
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><Text label="First name" value={form.firstName} onChange={v => { setForm({...form,firstName:v}); setAttendees(a => a.map((x,i) => i ? x : {...x,firstName:v})); }} required/><Text label="Last name" value={form.lastName} onChange={v => { setForm({...form,lastName:v}); setAttendees(a => a.map((x,i) => i ? x : {...x,lastName:v})); }} required/><Text label="Email" type="email" value={form.email} onChange={v => setForm({...form,email:v})} required/><Text label="Phone" type="tel" value={form.phone} onChange={v => setForm({...form,phone:v})} required/></div>
    <fieldset className="mt-5"><legend className="t-caption font-semibold">Mailing address</legend><div className="mt-2 grid gap-3 sm:grid-cols-2">{(["line1","line2","city","state","postalCode","country"] as (keyof Address)[]).map(k => <Text key={k} label={k === "line1" ? "Address line 1" : k === "line2" ? "Address line 2 (optional)" : k === "postalCode" ? "Postal code" : k[0].toUpperCase()+k.slice(1)} value={address[k]} required={k !== "line2"} onChange={v => setAddress({...address,[k]:v})}/>)}</div></fieldset>
    <fieldset className="mt-5"><legend className="t-caption font-semibold">Attendees</legend>{attendees.map((a,i) => <div className="mt-2 grid gap-2 sm:grid-cols-2" key={i}><Text label={`Attendee ${i+1} first name`} value={a.firstName} required onChange={v => setAttendees(attendees.map((x,n) => n === i ? {...x,firstName:v} : x))}/><Text label={`Attendee ${i+1} last name`} value={a.lastName} required onChange={v => setAttendees(attendees.map((x,n) => n === i ? {...x,lastName:v} : x))}/>{session.collectId && <label className="t-caption sm:col-span-2">Photo ID for attendee {i+1}<input required accept="image/jpeg,image/png" type="file" onChange={e => { const f=e.target.files?.[0]; if (f && f.size > 2*1024*1024) {setError("Each ID image must be 2 MiB or smaller."); return;} setFiles(old => { const next=[...old]; if(f) next[i]=f; return next; }); }} className="mt-1 block w-full text-[.75rem]" /></label>}</div>)}</fieldset>
    {session.collectId && <div className="mt-4 rounded-card-sm bg-white p-4"><p className="t-footnote text-ink-muted">Photo IDs are private to staff for verification, never public or sent by email, and deleted 30 days after class. JPEG or PNG only; 2 MiB each, 8 MiB total.</p><Check label="I consent to private ID collection for this class." checked={form.consent} onChange={v => setForm({...form,consent:v})}/></div>}
    <Check label="I acknowledge the class requirements above." checked={form.ack} onChange={v => setForm({...form,ack:v})}/>
    <Button type="submit" disabled={unavailable || saving || !form.ack || (session.collectId && !form.consent)} className="mt-5 w-full">{saving ? "Reserving…" : session.priceCents > 0 ? "Continue to payment" : "Reserve seat"}</Button>
  </form>;
}
function Text({label,value,onChange,required,type="text"}:{label:string;value:string;onChange:(v:string)=>void;required?:boolean;type?:string}) { return <label className="t-caption block font-semibold">{label}<input type={type} required={required} value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-lg bg-white px-3 py-2 font-normal ring-1 ring-ink/15" /></label>; }
function Check({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}) { return <label className="t-footnote mt-4 flex gap-2 text-ink-muted"><input required type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-ink"/>{label}</label>; }
export function Notice({children,tone}:{children:React.ReactNode;tone:"error"|"info"}) { return <p role="alert" className={`t-caption mt-4 rounded-card-sm px-4 py-3 ${tone === "error" ? "bg-red-50 text-danger" : "bg-paper-2 text-ink-muted"}`}>{children}</p>; }