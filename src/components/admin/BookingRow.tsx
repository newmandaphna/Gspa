import { setBookingStatusAction } from "@/app/admin/actions";
import type { BookingRow as Row } from "@/lib/booking";
import { formatMoney, toHHMMInTz, labelForHHMM } from "@/lib/time";
import { cn } from "@/lib/cn";

const TONE: Record<string, string> = {
  confirmed: "bg-success/15 text-[#1f7a3a]",
  pending: "bg-accent/25 text-accent-deep",
  cancelled: "bg-ink/10 text-ink-muted",
};

export function BookingRow({ row, compact = false }: { row: Row; compact?: boolean }) {
  const { booking, experience } = row;
  const start = labelForHHMM(toHHMMInTz(booking.startsAt));
  const end = labelForHHMM(toHHMMInTz(booking.endsAt));
  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="t-body font-medium">
          <span className="tabular-nums">{start}</span>
          <span className="text-ink-faint"> – {end}</span> · {experience.name}
        </p>
        <p className="t-caption text-ink-muted">
          {booking.firstName} {booking.lastName} · {booking.guests} guest{booking.guests === 1 ? "" : "s"} · {booking.units} unit{booking.units === 1 ? "" : "s"} · {formatMoney(booking.amountCents)} ·{" "}
          <span className="font-mono">{booking.code}</span>
          {booking.memberNumber && <span> · member {booking.memberNumber}</span>}
          {booking.notes && !compact && <span className="block text-ink">Note: {booking.notes}</span>}
          {!compact && (
            <span className="block">
              {booking.email} · {booking.phone}
            </span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn("t-footnote rounded-pill px-2 py-0.5 font-semibold capitalize", TONE[booking.status] ?? TONE.cancelled)}>{booking.status}</span>
        <span className="t-footnote rounded-pill bg-paper-2 px-2 py-0.5 font-semibold capitalize text-ink-muted">{booking.paymentStatus.replace(/_/g, " ")}</span>
        {!compact && booking.status !== "cancelled" && (
          <>
            {booking.paymentStatus !== "paid" && (
              <form action={setBookingStatusAction}>
                <input type="hidden" name="id" value={booking.id} />
                <input type="hidden" name="paymentStatus" value="paid" />
                <button type="submit" className="t-footnote rounded-pill bg-ink px-2.5 py-1 font-semibold text-snow">
                  Mark paid
                </button>
              </form>
            )}
            {booking.status === "pending" && (
              <form action={setBookingStatusAction}>
                <input type="hidden" name="id" value={booking.id} />
                <input type="hidden" name="status" value="confirmed" />
                <button type="submit" className="t-footnote rounded-pill bg-ink px-2.5 py-1 font-semibold text-snow">
                  Confirm
                </button>
              </form>
            )}
            <form action={setBookingStatusAction}>
              <input type="hidden" name="id" value={booking.id} />
              <input type="hidden" name="status" value="cancelled" />
              <button type="submit" className="t-footnote rounded-pill px-2.5 py-1 font-semibold text-ink-muted ring-1 ring-inset ring-ink/15 hover:text-ink">
                Cancel
              </button>
            </form>
          </>
        )}
      </div>
    </li>
  );
}
