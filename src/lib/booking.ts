import { randomInt } from "node:crypto";
import { and, asc, eq, gt, inArray, lt, ne, sql, type SQL } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db";
import { bookings, experiences, type Booking, type Experience } from "@/lib/db/schema";
import { BOOKING, RESOURCES, tierSatisfies, type ResourceKey } from "@/lib/config/site";
import { applyLoad, buildSlotWindows, canFit, cancelWindowHours, computeAmount, hoursFor, maxBookableDate, type Load, type Slot } from "@/lib/availability";
import { addDaysIso, compareIso, isHHMM, isIsoDate, todayIso, zonedToUtc } from "@/lib/time";
import { members } from "@/lib/db/schema";
import type { MemberContext } from "@/lib/members/service";
import { sendBookingConfirmation, type SendOptions } from "@/lib/email";
import { expireCheckoutSession, refundPaymentIntent, stripeEnabled } from "@/lib/stripe";

export type PaymentMode = "stripe" | "on_arrival";

export type CreateBookingInput = {
  experienceSlug: string;
  date: string;
  time: string;
  guests: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Typed by a guest who isn't signed in; validated against the members table for the advance-booking perk only. */
  memberNumber?: string | null;
  /** The signed-in member (from the session cookie). Unlocks member-only items and member pricing. */
  member?: MemberContext | null;
  notes?: string | null;
  ackRequirements: boolean;
  paymentMode: PaymentMode;
  now?: Date;
};

export type BookingErrorCode = "NOT_FOUND" | "INVALID" | "UNAVAILABLE" | "TOO_MANY" | "MEMBERS_ONLY";

/** Per-unit price for this buyer. */
export function priceFor(experience: Pick<Experience, "priceCents" | "memberPriceCents">, member: MemberContext | null | undefined): number {
  return member && experience.memberPriceCents != null ? experience.memberPriceCents : experience.priceCents;
}

/** Whether a (possibly anonymous) buyer may see/book this experience. */
export function canAccess(experience: Pick<Experience, "memberOnly" | "minTier">, member: MemberContext | null | undefined): { ok: true } | { ok: false; code: BookingErrorCode; error: string } {
  if (experience.memberOnly && !member) return { ok: false, code: "MEMBERS_ONLY", error: "This is available to members. Sign in to reserve it." };
  if (experience.minTier && (!member || !tierSatisfies(member.tier, experience.minTier))) {
    return { ok: false, code: "MEMBERS_ONLY", error: "This experience requires a higher membership tier." };
  }
  return { ok: true };
}

/**
 * A typed member number counts only if it belongs to an active member and,
 * when the booker's email is known, matches the email on file, so a number
 * seen on someone else's confirmation cannot borrow their window or put their
 * name on a reservation. Returns the number and tier.
 */
async function validatedMemberNumber(db: Db, memberNumber: string | null | undefined, email?: string): Promise<{ memberNumber: string; tier: string } | null> {
  const n = memberNumber?.trim().toUpperCase();
  if (!n) return null;
  const [m] = await db
    .select({ memberNumber: members.memberNumber, status: members.status, tier: members.tier, email: members.email })
    .from(members)
    .where(eq(members.memberNumber, n))
    .limit(1);
  if (!m || m.status !== "active") return null;
  if (email !== undefined && m.email !== email.trim().toLowerCase()) return null;
  return { memberNumber: m.memberNumber, tier: m.tier };
}
export type BookingResult =
  | { ok: true; booking: Booking; experience: Experience }
  | { ok: false; code: BookingErrorCode; error: string };

const ACTIVE = ["confirmed", "pending"] as const;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(): string {
  let s = "GS-";
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return s;
}

export function capacityFor(resource: string): number {
  return RESOURCES[resource as ResourceKey]?.capacity ?? 0;
}

export async function getExperienceBySlug(slug: string, db?: Db): Promise<Experience | null> {
  const d = db ?? (await getDb());
  const rows = await d.select().from(experiences).where(eq(experiences.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function listExperiences(db?: Db): Promise<Experience[]> {
  const d = db ?? (await getDb());
  return d.select().from(experiences).where(eq(experiences.active, true)).orderBy(asc(experiences.sortOrder));
}

/**
 * Cancel Stripe holds that were never paid. Cheap; runs before availability
 * reads. Only unpaid rows qualify: a hold the desk marked paid stays. The
 * cutoff trails Stripe's own expiry by BOOKING.holdGraceMin so a payment in
 * the last seconds of checkout (and its webhook) lands on a pending row; the
 * checkout.session.expired webhook frees abandoned holds on time.
 */
export async function sweepExpiredHolds(db: Db, now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - (BOOKING.pendingHoldMin + BOOKING.holdGraceMin) * 60_000);
  await db
    .update(bookings)
    .set({ status: "cancelled", updatedAt: now })
    .where(and(eq(bookings.status, "pending"), eq(bookings.paymentStatus, "unpaid"), lt(bookings.createdAt, cutoff)));
}

export async function loadForResource(db: Db, resource: string, from: Date, to: Date): Promise<Load[]> {
  const rows = await db
    .select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt, units: bookings.units })
    .from(bookings)
    .where(and(eq(bookings.resource, resource), lt(bookings.startsAt, to), gt(bookings.endsAt, from), inArray(bookings.status, [...ACTIVE])));
  return rows;
}

function dayWindow(dateISO: string): { from: Date; to: Date } {
  return { from: zonedToUtc(dateISO, "00:00"), to: zonedToUtc(addDaysIso(dateISO, 1), "00:00") };
}

export type Availability = {
  experience: Pick<Experience, "slug" | "name" | "durationMin" | "priceCents" | "maxGuestsPerUnit" | "maxUnitsPerBooking" | "resource"> & { unitPriceCents: number };
  date: string;
  open: boolean;
  hours: { open: string; close: string } | null;
  slots: Array<Pick<Slot, "time" | "label" | "available"> & { startsAt: string }>;
  reason?: "closed" | "past" | "too_far";
};

export async function getAvailability(
  slug: string,
  dateISO: string,
  opts: { member?: MemberContext | null; memberNumber?: string | null; now?: Date } = {},
): Promise<Availability | null> {
  const now = opts.now ?? new Date();
  const db = await getDb();
  const experience = await getExperienceBySlug(slug, db);
  if (!experience || !experience.active || !experience.bookable) return null;
  if (!canAccess(experience, opts.member).ok) return null;
  const tier = opts.member?.tier ?? (await validatedMemberNumber(db, opts.memberNumber))?.tier ?? null;
  const base = {
    experience: {
      slug: experience.slug,
      name: experience.name,
      durationMin: experience.durationMin,
      priceCents: experience.priceCents,
      unitPriceCents: priceFor(experience, opts.member),
      maxGuestsPerUnit: experience.maxGuestsPerUnit,
      maxUnitsPerBooking: experience.maxUnitsPerBooking,
      resource: experience.resource,
    },
    date: dateISO,
  };
  const hours = hoursFor(dateISO);
  const today = todayIso(undefined, now);
  if (compareIso(dateISO, today) < 0) return { ...base, open: false, hours, slots: [], reason: "past" };
  if (compareIso(dateISO, maxBookableDate(today, tier)) > 0) return { ...base, open: false, hours, slots: [], reason: "too_far" };
  if (!hours) return { ...base, open: false, hours: null, slots: [], reason: "closed" };

  await sweepExpiredHolds(db, now);
  const windows = buildSlotWindows({ dateISO, durationMin: experience.durationMin, hours, now });
  const { from, to } = dayWindow(dateISO);
  const load = await loadForResource(db, experience.resource, from, to);
  const slots = applyLoad(windows, load, capacityFor(experience.resource));
  return {
    ...base,
    open: true,
    hours,
    slots: slots.map((s) => ({ time: s.time, label: s.label, available: s.available, startsAt: s.startsAt.toISOString() })),
  };
}

export async function createBooking(input: CreateBookingInput): Promise<BookingResult> {
  const now = input.now ?? new Date();
  if (!isIsoDate(input.date) || !isHHMM(input.time)) return { ok: false, code: "INVALID", error: "Invalid date or time." };
  if (!input.ackRequirements) return { ok: false, code: "INVALID", error: "Please acknowledge the range requirements." };
  const db = await getDb();
  const experience = await getExperienceBySlug(input.experienceSlug, db);
  if (!experience || !experience.active || !experience.bookable) return { ok: false, code: "NOT_FOUND", error: "That experience is not available to book online." };
  const access = canAccess(experience, input.member);
  if (!access.ok) return access;

  const guests = Math.floor(input.guests);
  if (guests < BOOKING.minGuests || guests > BOOKING.maxGuests) return { ok: false, code: "INVALID", error: `Guests must be between ${BOOKING.minGuests} and ${BOOKING.maxGuests}.` };
  const maxGuestsAllowed = experience.fixedUnits ? experience.maxGuestsPerUnit : experience.maxUnitsPerBooking * experience.maxGuestsPerUnit;
  if (guests > maxGuestsAllowed) {
    return { ok: false, code: "TOO_MANY", error: `Online reservations cover up to ${maxGuestsAllowed} guests for this experience. For larger groups, contact us about a private event.` };
  }
  const { units, amountCents } = computeAmount(experience, guests, Boolean(input.member));

  const today = todayIso(undefined, now);
  const validated = input.member ? { memberNumber: input.member.memberNumber, tier: input.member.tier } : await validatedMemberNumber(db, input.memberNumber, input.email);
  if (!input.member && input.memberNumber?.trim() && !validated) {
    return { ok: false, code: "INVALID", error: "That member number wasn't recognized, or doesn't match the email on file. Leave it blank, or use the email your membership is registered under." };
  }
  const memberNumber = validated?.memberNumber ?? null;
  if (compareIso(input.date, today) < 0) return { ok: false, code: "INVALID", error: "That date has passed." };
  if (compareIso(input.date, maxBookableDate(today, validated?.tier ?? null)) > 0) return { ok: false, code: "INVALID", error: "That date is beyond your online booking window." };

  const hours = hoursFor(input.date);
  const windows = buildSlotWindows({ dateISO: input.date, durationMin: experience.durationMin, hours, now });
  const slot = windows.find((w) => w.time === input.time);
  if (!slot) return { ok: false, code: "UNAVAILABLE", error: "That start time is no longer available. Please choose another." };

  const capacity = capacityFor(experience.resource);
  // Nothing to collect (a member-included service) confirms immediately; Stripe rejects a $0 Checkout.
  const mode: PaymentMode = amountCents === 0 ? "on_arrival" : input.paymentMode;
  const status = mode === "stripe" ? "pending" : "confirmed";
  const paymentStatus = mode === "stripe" ? "unpaid" : "pay_on_arrival";

  await sweepExpiredHolds(db, now);

  const result = await db.transaction(async (tx) => {
    // Serialize writers for this resource+day so two guests can't both take the last lane.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`${experience.resource}:${input.date}`}))`);
    const { from, to } = dayWindow(input.date);
    const load = await loadForResource(tx as unknown as Db, experience.resource, from, to);
    if (!canFit(slot.startsAt, slot.endsAt, units, load, capacity)) {
      return null;
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const existing = await tx.select({ id: bookings.id }).from(bookings).where(eq(bookings.code, code)).limit(1);
      if (existing.length) continue;
      const [row] = await tx
        .insert(bookings)
        .values({
          code,
          experienceId: experience.id,
          resource: experience.resource,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          guests,
          units,
          amountCents,
          status,
          paymentStatus,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone.trim(),
          memberNumber,
          memberId: input.member?.id ?? null,
          notes: input.notes?.trim() || null,
          ackRequirements: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return row;
    }
    throw new Error("Could not allocate a confirmation code");
  });

  if (!result) return { ok: false, code: "UNAVAILABLE", error: "Sorry, that time just filled up. Please pick another slot." };
  return { ok: true, booking: result, experience };
}

export async function getBookingByCode(code: string): Promise<{ booking: Booking; experience: Experience } | null> {
  const db = await getDb();
  const rows = await db
    .select({ booking: bookings, experience: experiences })
    .from(bookings)
    .innerJoin(experiences, eq(bookings.experienceId, experiences.id))
    .where(eq(bookings.code, code.toUpperCase().trim()))
    .limit(1);
  return rows[0] ?? null;
}

export async function attachStripeSession(bookingId: number, sessionId: string): Promise<void> {
  const db = await getDb();
  await db.update(bookings).set({ stripeSessionId: sessionId, updatedAt: new Date() }).where(eq(bookings.id, bookingId));
}

/**
 * Records a Checkout payment. Returns the row only when this call is what
 * made it paid: a session that is delivered twice (Stripe retries any
 * non-2xx, and the confirmation page may reconcile first) finds the row
 * already paid and gets null, so nothing downstream runs twice.
 */
export async function markPaidBySession(sessionId: string, paymentIntentId: string | null): Promise<Booking | null> {
  const db = await getDb();
  const [row] = await db
    .update(bookings)
    .set({ status: "confirmed", paymentStatus: "paid", stripePaymentIntentId: paymentIntentId, updatedAt: new Date() })
    .where(and(eq(bookings.stripeSessionId, sessionId), inArray(bookings.status, ["pending", "confirmed"]), ne(bookings.paymentStatus, "paid")))
    .returning();
  return row ?? null;
}

/**
 * markPaidBySession plus the confirmation email, sent only by the call that
 * made the row paid, whichever of the webhook, the confirmation page or a
 * cancel that found the payment landed gets there first. The email never
 * blocks or fails the caller.
 */
export async function confirmPaidSession(sessionId: string, paymentIntentId: string | null, opts: SendOptions = {}): Promise<Booking | null> {
  const paid = await markPaidBySession(sessionId, paymentIntentId);
  if (!paid) return null;
  try {
    const found = await getBookingByCode(paid.code);
    if (found) void sendBookingConfirmation(found.booking, found.experience, opts);
  } catch (err) {
    console.error(`[booking] could not prepare the confirmation email for ${paid.code}`, err);
  }
  return paid;
}

/** The booking attached to a Checkout session, whatever its status. */
export async function getBookingBySession(sessionId: string): Promise<Booking | null> {
  const db = await getDb();
  const [row] = await db.select().from(bookings).where(eq(bookings.stripeSessionId, sessionId)).limit(1);
  return row ?? null;
}

/** Records a refund issued for a session's payment (e.g. paid after the hold was cancelled). */
export async function markRefundedBySession(sessionId: string, paymentIntentId: string | null): Promise<void> {
  const db = await getDb();
  await db.update(bookings).set({ paymentStatus: "refunded", stripePaymentIntentId: paymentIntentId, updatedAt: new Date() }).where(eq(bookings.stripeSessionId, sessionId));
}

/**
 * Stripe reports the Checkout page closed unpaid. Only an unpaid hold is
 * released; the row comes back when this call released it, so the "hold
 * released" note goes out once and never for a hold the guest or the desk
 * had already closed.
 */
export async function cancelBySession(sessionId: string): Promise<Booking | null> {
  const db = await getDb();
  const [row] = await db
    .update(bookings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(bookings.stripeSessionId, sessionId), eq(bookings.status, "pending"), eq(bookings.paymentStatus, "unpaid")))
    .returning();
  return row ?? null;
}

/**
 * A hold was cancelled here and Stripe answered that its Checkout had just
 * completed. The slot is already released, so the money goes back the same
 * way the webhook returns a payment for a cancelled hold. Idempotent per
 * booking, so the webhook doing the same is harmless.
 */
async function refundLatePayment(sessionId: string, paymentIntentId: string | null, code: string, refund: CancelOptions["refund"]): Promise<void> {
  if (!paymentIntentId) return;
  try {
    await (refund ?? refundPaymentIntent)(paymentIntentId, code);
    await markRefundedBySession(sessionId, paymentIntentId);
  } catch (err) {
    console.error(`[booking] payment ${paymentIntentId} landed on cancelled ${code} and could not be refunded yet`, err);
  }
}

/** The experience rides along so the caller can mail the guest without a second read. */
export type CancelResult = { ok: true; booking: Booking; experience: Experience } | { ok: false; error: string };

export type CancelOptions = {
  email?: string;
  byAdmin?: boolean;
  now?: Date;
  /** Refunds a paid card booking; defaults to Stripe. Injectable for tests. */
  refund?: (paymentIntentId: string, bookingCode: string) => Promise<void>;
};

/**
 * Cancellation. Guests must match the email on file and respect the free
 * window for the experience (24 h for lanes, 72 h for suites and events).
 * Inside that window a guest's card is refunded in full before the row is
 * cancelled; if the refund fails the reservation stays active. Staff cancel
 * without a refund (no-shows and inside-window cancels keep the fee per the
 * Terms) and issue any refund deliberately. A pending hold is marked
 * cancelled before its Checkout page is closed: Stripe reports the expiry
 * at once, and the webhook must find the row already cancelled so it does
 * not mail "your payment did not complete" on top of "cancelled".
 */
export async function cancelBooking(code: string, opts: CancelOptions): Promise<CancelResult> {
  const now = opts.now ?? new Date();
  const found = await getBookingByCode(code);
  if (!found) return { ok: false, error: "Reservation not found." };
  const { booking, experience } = found;
  if (booking.status === "cancelled") return { ok: false, error: "This reservation is already cancelled." };
  if (!opts.byAdmin) {
    if (!opts.email || opts.email.trim().toLowerCase() !== booking.email) return { ok: false, error: "The email address does not match this reservation." };
    const hours = cancelWindowHours(experience);
    const cutoff = new Date(booking.startsAt.getTime() - hours * 3_600_000);
    if (now > cutoff) return { ok: false, error: `Online cancellation closes ${hours} hours before your session. Please call us.` };
  }

  const patch: { status: string; paymentStatus?: string; updatedAt: Date } = { status: "cancelled", updatedAt: now };
  const refundable = !opts.byAdmin && booking.paymentStatus === "paid" && booking.stripePaymentIntentId && booking.amountCents > 0;
  if (refundable && (opts.refund || stripeEnabled())) {
    try {
      await (opts.refund ?? refundPaymentIntent)(booking.stripePaymentIntentId!, booking.code);
      patch.paymentStatus = "refunded";
    } catch (err) {
      console.error(`[booking] refund failed for ${booking.code}`, err);
      return { ok: false, error: "We couldn't refund your card automatically, so the reservation is still active. Please call us and we'll take care of it." };
    }
  }

  // Conditional on the status just read: a hold whose payment landed in the meantime is confirmed now, not cancelled.
  const db = await getDb();
  const [row] = await db
    .update(bookings)
    .set(patch)
    .where(and(eq(bookings.id, booking.id), eq(bookings.status, booking.status)))
    .returning();
  if (!row) return { ok: false, error: "This reservation just changed. Reload the page and try again." };

  if (booking.status === "pending" && booking.stripeSessionId) {
    const result = await expireCheckoutSession(booking.stripeSessionId);
    if (result.status === "paid") await refundLatePayment(booking.stripeSessionId, result.paymentIntentId, booking.code, opts.refund);
  }
  return { ok: true, booking: row, experience };
}

export type BookingRow = { booking: Booking; experience: Experience };

export async function listBookings(opts: { from: Date; to: Date; includeCancelled?: boolean }): Promise<BookingRow[]> {
  const db = await getDb();
  const where = opts.includeCancelled
    ? and(gt(bookings.startsAt, opts.from), lt(bookings.startsAt, opts.to))
    : and(gt(bookings.startsAt, opts.from), lt(bookings.startsAt, opts.to), inArray(bookings.status, [...ACTIVE]));
  return db
    .select({ booking: bookings, experience: experiences })
    .from(bookings)
    .innerJoin(experiences, eq(bookings.experienceId, experiences.id))
    .where(where)
    .orderBy(asc(bookings.startsAt));
}

/**
 * Front-desk status patch. Cancelled is terminal here (a stale "Confirm" on
 * a swept hold cannot resurrect it into a slot that has since been resold);
 * marking a pending hold paid also confirms it so the sweep leaves it alone;
 * cancelling a pending hold marks the row first and then closes its open
 * Checkout page, so the expiry webhook finds nothing left to release.
 */
export async function adminSetStatus(id: number, patch: { status?: string; paymentStatus?: string }): Promise<void> {
  const db = await getDb();
  const set: { status?: string | SQL; paymentStatus?: string; updatedAt: Date } = { ...patch, updatedAt: new Date() };
  if (patch.status === "cancelled") {
    const [row] = await db.select({ status: bookings.status, code: bookings.code, stripeSessionId: bookings.stripeSessionId }).from(bookings).where(eq(bookings.id, id)).limit(1);
    if (row?.status === "pending" && row.stripeSessionId) {
      const [cancelled] = await db
        .update(bookings)
        .set(set)
        .where(and(eq(bookings.id, id), eq(bookings.status, "pending")))
        .returning({ id: bookings.id });
      // Paid in the meantime: the row is confirmed now and stays so. Staff can cancel again (and refund) from a fresh page.
      if (!cancelled) return;
      const result = await expireCheckoutSession(row.stripeSessionId);
      if (result.status === "paid") await refundLatePayment(row.stripeSessionId, result.paymentIntentId, row.code, undefined);
      return;
    }
  }
  if (patch.paymentStatus === "paid" && patch.status === undefined) {
    set.status = sql`CASE WHEN ${bookings.status} = 'pending' THEN 'confirmed' ELSE ${bookings.status} END`;
  }
  const where = patch.status ? and(eq(bookings.id, id), inArray(bookings.status, [...ACTIVE])) : eq(bookings.id, id);
  await db.update(bookings).set(set).where(where);
}
