import { and, asc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db";
import { bookings, classSessions, experiences, type ClassSession, type Experience } from "@/lib/db/schema";
import { generateCode, snapshotBookingExperience, sweepExpiredHolds, type BookingResult, type BookingRow, type PaymentMode } from "@/lib/booking";
import { classEnrollmentSchema, classSessionInputSchema, type ClassEnrollmentInput, type ClassSessionInput } from "@/lib/classes-validation";
import { addDaysIso, isIsoDate, zonedToUtc } from "@/lib/time";
import { CATALOG } from "@/lib/content/catalog";

export type ClassSessionView = ClassSession & {
  experienceSlug: string;
  experienceName: string;
  seatsTaken: number;
  seatsRemaining: number;
  paidSeats: number;
  heldSeats: number;
};

async function seats(db: Db, id: number) {
  const [counts] = await db.select({
    seatsTaken: sql<number>`coalesce(sum(${bookings.guests}), 0)::int`,
    paidSeats: sql<number>`coalesce(sum(case when ${bookings.paymentStatus} = 'paid' then ${bookings.guests} else 0 end), 0)::int`,
    heldSeats: sql<number>`coalesce(sum(case when ${bookings.status} = 'pending' or ${bookings.paymentStatus} = 'pay_on_arrival' then ${bookings.guests} else 0 end), 0)::int`,
  }).from(bookings).where(and(eq(bookings.classSessionId, id), inArray(bookings.status, ["pending", "confirmed"])));
  return counts;
}

async function view(db: Db, session: ClassSession, experience: Experience): Promise<ClassSessionView> {
  const counts = await seats(db, session.id);
  return { ...session, experienceSlug: experience.slug, experienceName: experience.name, ...counts, seatsRemaining: Math.max(0, session.capacity - counts.seatsTaken) };
}

export async function listClassSessions(opts: { date?: string; includeUnpublished?: boolean } = {}): Promise<ClassSessionView[]> {
  if (opts.date && !isIsoDate(opts.date)) throw new Error("Invalid class date.");
  const db = await getDb();
  await sweepExpiredHolds(db, new Date());
  const rows = await db.select({ session: classSessions, experience: experiences }).from(classSessions)
    .innerJoin(experiences, eq(classSessions.experienceId, experiences.id))
    .where(and(
      opts.includeUnpublished ? undefined : inArray(classSessions.status, ["open", "closed"]),
      opts.date ? gte(classSessions.startsAt, zonedToUtc(opts.date, "00:00")) : undefined,
      opts.date ? lt(classSessions.startsAt, zonedToUtc(addDaysIso(opts.date, 1), "00:00")) : undefined,
    )).orderBy(asc(classSessions.startsAt));
  return Promise.all(rows.map(({ session, experience }) => view(db, session, experience)));
}

export async function getClassSession(id: number): Promise<ClassSessionView | null> {
  if (!Number.isSafeInteger(id) || id < 1) return null;
  const db = await getDb();
  await sweepExpiredHolds(db, new Date());
  const [row] = await db.select({ session: classSessions, experience: experiences }).from(classSessions)
    .innerJoin(experiences, eq(classSessions.experienceId, experiences.id)).where(eq(classSessions.id, id));
  return row ? view(db, row.session, row.experience) : null;
}

export async function saveClassSession(input: ClassSessionInput, id?: number): Promise<{ ok: true; session: ClassSessionView } | { ok: false; error: string }> {
  const parsed = classSessionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (id !== undefined && (!Number.isSafeInteger(id) || id < 1)) return { ok: false, error: "Invalid session ID." };
  const v = parsed.data;
  if (!CATALOG.some((c) => c.slug === v.experienceSlug && c.category === "training")) return { ok: false, error: "Choose a training catalog experience." };
  const db = await getDb();
  await sweepExpiredHolds(db, new Date());
  return db.transaction(async (tx) => {
    const d = tx as unknown as Db;
    if (id !== undefined) await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`class:${id}`}))`);
    const [experience] = await tx.select().from(experiences).where(and(eq(experiences.slug, v.experienceSlug), eq(experiences.category, "training")));
    if (!experience) return { ok: false as const, error: "Training experience not found." };
    const patch = {
      experienceId: experience.id, title: v.title, startsAt: zonedToUtc(v.date, v.startTime),
      endsAt: zonedToUtc(v.endDate, v.endTime), priceCents: v.priceCents, capacity: v.capacity,
      maxPerBooking: v.maxPerBooking, status: v.status, instructor: v.instructor || null,
      requirements: v.requirements || "", staffNotes: v.staffNotes || null, collectId: v.collectId, updatedAt: new Date(),
    };
    if (id !== undefined) {
      const [old] = await tx.select().from(classSessions).where(eq(classSessions.id, id));
      if (!old) return { ok: false as const, error: "Class session not found." };
      const occupied = (await seats(d, id)).seatsTaken;
      if (occupied > v.capacity) return { ok: false as const, error: "Capacity cannot be lower than active enrollments." };
      if (occupied) {
        if (v.status === "cancelled") return { ok: false as const, error: "Cancel/refund active enrollments first." };
        if (!["open", "closed"].includes(v.status)) return { ok: false as const, error: "Enrolled sessions must remain open or closed." };
        if (old.experienceId !== patch.experienceId || old.title !== patch.title || old.instructor !== patch.instructor ||
          old.requirements !== patch.requirements || old.collectId !== patch.collectId ||
          old.startsAt.getTime() !== patch.startsAt.getTime() || old.endsAt.getTime() !== patch.endsAt.getTime()) {
          return { ok: false as const, error: "Session details cannot change with active enrollments. Cancel/refund enrollments first." };
        }
      }
      const [session] = await tx.update(classSessions).set(patch).where(eq(classSessions.id, id)).returning();
      return { ok: true as const, session: await view(d, session, experience) };
    }
    const [session] = await tx.insert(classSessions).values(patch).returning();
    return { ok: true as const, session: await view(d, session, experience) };
  });
}

export type CreateClassBookingInput = ClassEnrollmentInput & { paymentMode: PaymentMode; byAdmin?: boolean; now?: Date };

export async function createClassBooking(input: CreateClassBookingInput): Promise<BookingResult> {
  const parsed = classEnrollmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID", error: parsed.error.issues[0].message };
  if (!["stripe", "on_arrival"].includes(input.paymentMode)) return { ok: false, code: "INVALID", error: "Invalid payment mode." };
  const v = parsed.data;
  const now = input.now ?? new Date();
  const db = await getDb();
  await sweepExpiredHolds(db, now);
  return db.transaction(async (tx): Promise<BookingResult> => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`class:${v.sessionId}`}))`);
    const [row] = await tx.select({ session: classSessions, experience: experiences }).from(classSessions)
      .innerJoin(experiences, eq(classSessions.experienceId, experiences.id)).where(eq(classSessions.id, v.sessionId));
    if (!row) return { ok: false, code: "NOT_FOUND", error: "Class session not found." };
    const { session, experience } = row;
    if (experience.category !== "training" || !CATALOG.some((c) => c.slug === experience.slug && c.category === "training") ||
      session.startsAt <= now || !(session.status === "open" || (input.byAdmin && session.status === "closed"))) {
      return { ok: false, code: "UNAVAILABLE", error: "This class is not accepting enrollments." };
    }
    const guests = v.attendees.length;
    if (guests > session.maxPerBooking) return { ok: false, code: "TOO_MANY", error: `This class allows up to ${session.maxPerBooking} attendees per booking.` };
    if (guests + (await seats(tx as unknown as Db, session.id)).seatsTaken > session.capacity) return { ok: false, code: "UNAVAILABLE", error: "Not enough seats remain in this class." };
    const amountCents = session.priceCents * guests;
    if (!input.byAdmin && amountCents > 0 && input.paymentMode !== "stripe") return { ok: false, code: "INVALID", error: "Online class enrollment requires card payment." };
    const pending = amountCents > 0 && input.paymentMode === "stripe";
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const existing = await tx.select({ id: bookings.id }).from(bookings).where(eq(bookings.code, code)).limit(1);
      if (existing.length) continue;
      const [booking] = await tx.insert(bookings).values({
        code, classSessionId: session.id, experienceId: experience.id, resource: `class:${session.id}`,
        startsAt: session.startsAt, endsAt: session.endsAt, guests, units: guests, amountCents,
        status: pending ? "pending" : "confirmed", paymentStatus: pending ? "unpaid" : "pay_on_arrival",
        firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone,
        mailingAddress: v.mailingAddress, attendees: v.attendees, ackRequirements: true,
        classDetails: { title: session.title, instructor: session.instructor, requirements: session.requirements, collectId: session.collectId },
        createdAt: now, updatedAt: now,
      }).returning();
      return { ok: true, booking, experience: snapshotBookingExperience({ booking, experience }).experience };
    }
    throw new Error("Could not allocate a confirmation code.");
  });
}

/** Staff-only: callers must authenticate before exposing roster PII. */
export async function listClassRoster(sessionId: number): Promise<BookingRow[]> {
  const db = await getDb();
  await sweepExpiredHolds(db, new Date());
  const rows = await db.select({ booking: bookings, experience: experiences }).from(bookings)
    .innerJoin(experiences, eq(bookings.experienceId, experiences.id))
    .where(eq(bookings.classSessionId, sessionId)).orderBy(asc(bookings.createdAt));
  return rows.map(snapshotBookingExperience);
}