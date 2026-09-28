/** Deliberately limited public DTO. Never include internal notes or booking data. */
export type PublicClassSession = {
  id: number; title: string; experienceName: string; startsAt: string; endsAt: string;
  priceCents: number; maxPerBooking: number; status: string; instructor: string | null;
  requirements: string; collectId: boolean; seatsRemaining: number;
};
export type ClassFlags = { paymentsEnabled: boolean; documentsEnabled: boolean };

export function upcomingClasses<T extends { id: number; startsAt: string | Date; status: string }>(sessions: T[], now = Date.now(), limit = Infinity): T[] {
  return sessions.filter(s => (s.status === "open" || s.status === "closed") && new Date(s.startsAt).getTime() > now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() || a.id - b.id).slice(0, limit);
}
export const classPrice = (cents: number) => cents === 0 ? "Free" : `${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100)} per person`;
const TZ = "America/New_York";
const dayFormat = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" });
const keyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const timeFormat = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
/** "9:00 AM" becomes "9 AM"; half hours keep their minutes. */
const time = (d: Date) => timeFormat.format(d).replace(":00", "");
/**
 * Club-local date range, the way the desk would say it:
 * one day "Sat, Nov 7 · 10 AM to 11:30 AM", two days "Sat, Oct 17, 9 AM to Sun, Oct 18, 6 PM".
 */
export const classDateRange = (s: Pick<PublicClassSession, "startsAt" | "endsAt">) => {
  const a = new Date(s.startsAt), b = new Date(s.endsAt);
  return keyFormat.format(a) === keyFormat.format(b)
    ? `${dayFormat.format(a)} · ${time(a)} to ${time(b)}`
    : `${dayFormat.format(a)}, ${time(a)} to ${dayFormat.format(b)}, ${time(b)}`;
};
export const classAvailability = (s: PublicClassSession) => s.status !== "open" ? "Enrollment closed" : s.seatsRemaining <= 0 ? "Sold out" : `${s.seatsRemaining} seat${s.seatsRemaining === 1 ? "" : "s"} available`;
export const canEnroll = (s: PublicClassSession, flags: ClassFlags) => s.status === "open" && s.seatsRemaining > 0 && new Date(s.startsAt).getTime() > Date.now() && (s.priceCents === 0 || flags.paymentsEnabled) && (!s.collectId || flags.documentsEnabled);