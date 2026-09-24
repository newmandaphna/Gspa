import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { listBookings } from "@/lib/booking";
import { listInquiries } from "@/lib/inquiries";
import { listMemberRequests, memberStats } from "@/lib/members/service";
import { addDaysIso, formatDateLong, formatMoney, todayIso, toHHMMInTz, labelForHHMM, zonedToUtc } from "@/lib/time";
import { BookingRow } from "@/components/admin/BookingRow";

export const metadata: Metadata = { title: "Front desk · Today", robots: { index: false } };

export default async function AdminHome() {
  await requireAdmin();
  const today = todayIso();
  const from = zonedToUtc(today, "00:00");
  const to = zonedToUtc(addDaysIso(today, 1), "00:00");
  const weekEnd = zonedToUtc(addDaysIso(today, 7), "00:00");
  const [todays, week, stats, requests, inquiries] = await Promise.all([
    listBookings({ from, to }),
    listBookings({ from, to: weekEnd }),
    memberStats(),
    listMemberRequests({ openOnly: true }),
    listInquiries(5),
  ]);
  const revenueToday = todays.reduce((s, r) => s + r.booking.amountCents, 0);

  return (
    <div>
      <h1 className="t-2">{formatDateLong(today)}</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label="Today" value={String(todays.length)} sub="reservations" />
        <Tile label="Today" value={formatMoney(revenueToday)} sub="booked value" />
        <Tile label="Next 7 days" value={String(week.length)} sub="reservations" />
        <Tile label="Members" value={String(stats.active)} sub={`${stats.pending} pending`} />
        <Tile label="Open requests" value={String(stats.openRequests)} sub="need a reply" href="/admin/requests" />
        <Tile label="Inquiries" value={String(inquiries.length)} sub="latest" href="/admin/inquiries" />
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="t-3">Today&apos;s schedule</h2>
          <Link href={`/admin/bookings?date=${today}`} className="link-arrow text-[0.9375rem]">
            Manage
          </Link>
        </div>
        {todays.length === 0 ? (
          <p className="t-body mt-3 text-ink-muted">Nothing on the books today.</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/10 rounded-card-sm bg-white ring-1 ring-ink/8">
            {todays.map((r) => (
              <BookingRow key={r.booking.id} row={r} compact />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="t-3">Open member requests</h2>
          {requests.length === 0 ? (
            <p className="t-body mt-3 text-ink-muted">All caught up.</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10 rounded-card-sm bg-white ring-1 ring-ink/8">
              {requests.slice(0, 6).map(({ request, member }) => (
                <li key={request.id} className="px-4 py-3">
                  <p className="t-body font-medium">
                    {member.firstName} {member.lastName} <span className="t-caption text-ink-muted">· {request.kind.replace("_", " ")}</span>
                  </p>
                  <p className="t-caption text-ink-muted">{request.details}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="t-3">Latest inquiries</h2>
          {inquiries.length === 0 ? (
            <p className="t-body mt-3 text-ink-muted">No inquiries yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10 rounded-card-sm bg-white ring-1 ring-ink/8">
              {inquiries.map((i) => (
                <li key={i.id} className="px-4 py-3">
                  <p className="t-body font-medium">
                    {i.name} <span className="t-caption text-ink-muted">· {i.kind}</span>
                  </p>
                  <p className="t-caption text-ink-muted">
                    {i.email}
                    {i.guests ? ` · ${i.guests} guests` : ""}
                    {i.preferredDate ? ` · ${i.preferredDate}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <p className="t-footnote mt-10 text-ink-faint">
        Times shown in New York. Current time {labelForHHMM(toHHMMInTz(new Date()))}.
      </p>
    </div>
  );
}

function Tile({ label, value, sub, href }: { label: string; value: string; sub: string; href?: string }) {
  const body = (
    <>
      <p className="t-footnote text-ink-muted">{label}</p>
      <p className="t-3 mt-1">{value}</p>
      <p className="t-footnote text-ink-faint">{sub}</p>
    </>
  );
  return href ? (
    <Link href={href} className="rounded-card-sm bg-white p-4 ring-1 ring-ink/8 transition-colors hover:bg-paper">
      {body}
    </Link>
  ) : (
    <div className="rounded-card-sm bg-white p-4 ring-1 ring-ink/8">{body}</div>
  );
}
