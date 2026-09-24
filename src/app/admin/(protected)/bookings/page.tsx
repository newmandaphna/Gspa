import type { Metadata } from "next";
import Link from "next/link";
import { BookingRow } from "@/components/admin/BookingRow";
import { listBookings } from "@/lib/booking";
import { addDaysIso, formatDateLong, isIsoDate, todayIso, zonedToUtc } from "@/lib/time";

export const metadata: Metadata = { title: "Front desk · Reservations", robots: { index: false } };

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ date?: string; all?: string }> }) {
  const sp = await searchParams;
  const date = sp.date && isIsoDate(sp.date) ? sp.date : todayIso();
  const includeCancelled = sp.all === "1";
  const rows = await listBookings({ from: zonedToUtc(date, "00:00"), to: zonedToUtc(addDaysIso(date, 1), "00:00"), includeCancelled });
  const q = (d: string) => `/admin/bookings?date=${d}${includeCancelled ? "&all=1" : ""}`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-2">Reservations</h1>
          <p className="t-body mt-1 text-ink-muted">{formatDateLong(date)}</p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <Link href={q(addDaysIso(date, -1))} className="rounded-lg bg-white px-3 py-2 text-[0.9375rem] ring-1 ring-ink/10" aria-label="Previous day">
            ‹
          </Link>
          <input type="date" name="date" defaultValue={date} className="h-10 rounded-lg bg-white px-3 text-[0.9375rem] ring-1 ring-inset ring-ink/15" />
          {includeCancelled && <input type="hidden" name="all" value="1" />}
          <button type="submit" className="h-10 rounded-lg bg-ink px-3 text-[0.9375rem] font-medium text-snow">
            Go
          </button>
          <Link href={q(addDaysIso(date, 1))} className="rounded-lg bg-white px-3 py-2 text-[0.9375rem] ring-1 ring-ink/10" aria-label="Next day">
            ›
          </Link>
        </form>
      </div>
      <p className="t-caption mt-3">
        <Link href={q(todayIso())} className="underline underline-offset-2">
          Today
        </Link>
        {" · "}
        <Link href={`/admin/bookings?date=${date}${includeCancelled ? "" : "&all=1"}`} className="underline underline-offset-2">
          {includeCancelled ? "Hide cancelled" : "Show cancelled"}
        </Link>
      </p>
      {rows.length === 0 ? (
        <p className="t-body mt-6 text-ink-muted">No reservations on this day.</p>
      ) : (
        <ul className="mt-6 divide-y divide-ink/10 rounded-card-sm bg-white ring-1 ring-ink/8">
          {rows.map((r) => (
            <BookingRow key={r.booking.id} row={r} />
          ))}
        </ul>
      )}
    </div>
  );
}
