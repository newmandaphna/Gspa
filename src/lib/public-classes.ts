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
const dateFormat = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
export const classDateRange = (s: Pick<PublicClassSession, "startsAt" | "endsAt">) => `${dateFormat.format(new Date(s.startsAt))} – ${dateFormat.format(new Date(s.endsAt))} · America/New_York`;
export const classAvailability = (s: PublicClassSession) => s.status !== "open" ? "Enrollment closed" : s.seatsRemaining <= 0 ? "Sold out" : `${s.seatsRemaining} seat${s.seatsRemaining === 1 ? "" : "s"} available`;
export const canEnroll = (s: PublicClassSession, flags: ClassFlags) => s.status === "open" && s.seatsRemaining > 0 && new Date(s.startsAt).getTime() > Date.now() && (s.priceCents === 0 || flags.paymentsEnabled) && (!s.collectId || flags.documentsEnabled);