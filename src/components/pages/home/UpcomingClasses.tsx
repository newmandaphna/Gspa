"use client";

import { usePublicClasses } from "@/components/classes/usePublicClasses";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { classAvailability, classDateRange, classPrice, canEnroll } from "@/lib/public-classes";

export function UpcomingClasses() {
  const data = usePublicClasses();
  const sessions = data.sessions.slice(0, 3);
  return <Section theme="gray" id="upcoming-classes" aria-labelledby="upcoming-classes-title">
    <Container>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div><p className="t-eyebrow text-accent-deep">Scheduled instruction</p><h2 id="upcoming-classes-title" className="t-2 mt-3">Upcoming classes.</h2></div>
        <LinkArrow href="/training/classes">View full class schedule</LinkArrow>
      </div>
      {data.busy ? <p role="status" className="t-body mt-10 text-ink-muted">Loading upcoming classes…</p>
        : data.error ? <div role="alert" className="mt-10"><p className="t-body">We couldn’t load upcoming classes.</p><button onClick={data.reload} className="t-caption mt-3 underline underline-offset-4">Try again</button></div>
        : sessions.length === 0 ? <div className="mt-10"><h3 className="t-3">New class dates are coming soon.</h3><p className="t-body mt-3 text-ink-muted">No upcoming classes are currently listed. Check the schedule again or contact the front desk.</p></div>
        : <ul className="mt-10 grid gap-6 md:grid-cols-3">{sessions.map(s => <li key={s.id} className="flex flex-col rounded-card bg-white p-6 ring-1 ring-ink/10">
          <p className="font-mono text-[0.75rem] leading-relaxed text-accent-deep">{classDateRange(s)}</p>
          <h3 className="t-3 mt-4">{s.title}</h3>
          <p className="t-body mt-4">{classPrice(s.priceCents)}</p>
          <p className="t-caption mt-2 text-ink-muted">{classAvailability(s)}</p>
          <div className="mt-auto pt-6"><LinkArrow href={`/training/classes?session=${s.id}`}>{canEnroll(s, data) ? "Choose this class" : "View class"}</LinkArrow></div>
        </li>)}</ul>}
    </Container>
  </Section>;
}