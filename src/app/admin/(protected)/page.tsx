import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { listBookings } from "@/lib/booking";
import { listInquiries } from "@/lib/inquiries";
import { listMemberRequests, memberStats } from "@/lib/members/service";
import { addDaysIso, dayOfWeekIso, formatDateLong, formatMoney, todayIso, toHHMMInTz, toIsoDateInTz, labelForHHMM, zonedToUtc } from "@/lib/time";
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
                  <p className="t-body flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                    <span>
                      {i.name} <span className="t-caption text-ink-muted">· {i.kind}</span>
                    </span>
                    {i.kind === "founders" && <CallBackBadge createdAt={i.createdAt} />}
                  </p>
                  <p className="t-caption text-ink-muted">
                    {i.email}
                    {i.kind === "founders" && i.phone ? ` · ${i.phone}` : ""}
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

/**
 * A Founders "Request a conversation" is a promise to call within one business
 * day. The badge names the day the call is due: the next weekday after the
 * request came in, New York time. Gold reads as "act on this" on the Today screen.
 */
function CallBackBadge({ createdAt }: { createdAt: Date }) {
  const due = callBackDue(createdAt);
  const overdue = due < todayIso();
  return (
    <span
      className={
        overdue
          ? "t-footnote inline-flex items-center gap-1 rounded-pill bg-danger/10 px-2 py-0.5 font-semibold text-danger"
          : "t-footnote inline-flex items-center gap-1 rounded-pill bg-accent/25 px-2 py-0.5 font-semibold text-accent-deep"
      }
    >
      <span aria-hidden="true" className={overdue ? "h-1.5 w-1.5 rounded-full bg-danger" : "h-1.5 w-1.5 rounded-full bg-accent-deep"} />
      Call back {overdue ? "overdue" : `by ${shortDate(due)}`}
    </span>
  );
}

/** "Thu, Sep 25" for a calendar date. */
function shortDate(dateISO: string): string {
  const [y, mo, d] = dateISO.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, mo - 1, d)));
}

/** One business day after the request: the next Monday to Friday date after it arrived. */
function callBackDue(createdAt: Date): string {
  let d = addDaysIso(toIsoDateInTz(createdAt), 1);
  while (dayOfWeekIso(d) === 0 || dayOfWeekIso(d) === 6) d = addDaysIso(d, 1);
  return d;
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
