import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { bookings, experiences, memberRequests, members, type Member, type MemberRequest, type Experience, type Booking } from "@/lib/db/schema";
import { TIERS, type TierKey } from "@/lib/config/site";
import { generateActivationCode, hashPassword, normalizeCode, validatePassword, verifyPassword } from "@/lib/members/crypto";

export type MemberContext = {
  id: number;
  tier: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
};

export function toContext(m: Member): MemberContext {
  return { id: m.id, tier: m.tier, memberNumber: m.memberNumber, firstName: m.firstName, lastName: m.lastName, email: m.email, phone: m.phone };
}

export const REQUEST_KINDS = {
  locker: "Locker rental",
  guest_pass: "Guest pass",
  storage: "Firearm storage",
  ammo: "Ammunition order",
  gunsmith: "Gunsmith work order",
  general: "Concierge request",
} as const;
export type RequestKind = keyof typeof REQUEST_KINDS;

export type CreateMemberInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  tier: TierKey;
  billing: "annual" | "lifetime";
  renewsAt?: Date | null;
  guestPasses?: number;
  notes?: string | null;
  status?: "pending" | "active";
};

export type ServiceResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Staff creates the member after vetting. Returns the one-time activation code. */
export async function createMember(input: CreateMemberInput): Promise<ServiceResult<{ member: Member; activationCode: string }>> {
  if (!TIERS.includes(input.tier)) return { ok: false, error: "Unknown tier." };
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Enter a valid email." };
  const db = await getDb();
  const dup = await db.select({ id: members.id }).from(members).where(eq(members.email, email)).limit(1);
  if (dup.length) return { ok: false, error: "A member with that email already exists." };
  const activationCode = generateActivationCode();
  const now = new Date();
  const renewsAt = input.billing === "lifetime" ? null : (input.renewsAt ?? new Date(now.getTime() + 365 * 24 * 3_600_000));
  const member = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(members)
      .values({
        memberNumber: `pending-${now.getTime()}-${Math.floor(Math.random() * 1e6)}`,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
        phone: input.phone?.trim() || null,
        tier: input.tier,
        billing: input.billing,
        status: input.status ?? "active",
        joinedAt: now,
        renewsAt,
        activationCode,
        guestPassesRemaining: input.guestPasses ?? 0,
        notes: input.notes?.trim() || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    const memberNumber = `GS-M-${1000 + row.id}`;
    const [updated] = await tx.update(members).set({ memberNumber }).where(eq(members.id, row.id)).returning();
    return updated;
  });
  return { ok: true, value: { member, activationCode } };
}

export async function regenerateActivation(memberId: number): Promise<string> {
  const db = await getDb();
  const code = generateActivationCode();
  await db.update(members).set({ activationCode: code, updatedAt: new Date() }).where(eq(members.id, memberId));
  return code;
}

/** Member turns the activation code into a password. */
export async function activateMember(input: { email: string; activationCode: string; password: string }): Promise<ServiceResult<Member>> {
  const pwErr = validatePassword(input.password);
  if (pwErr) return { ok: false, error: pwErr };
  const db = await getDb();
  const email = input.email.trim().toLowerCase();
  const [m] = await db.select().from(members).where(eq(members.email, email)).limit(1);
  const code = normalizeCode(input.activationCode);
  if (!m || !m.activationCode || normalizeCode(m.activationCode) !== code) return { ok: false, error: "That email and activation code don't match." };
  if (m.status === "suspended" || m.status === "expired") return { ok: false, error: "This membership is not active. Please contact the club." };
  const [updated] = await db
    .update(members)
    .set({ passwordHash: hashPassword(input.password), activationCode: null, status: m.status === "pending" ? "active" : m.status, updatedAt: new Date() })
    .where(eq(members.id, m.id))
    .returning();
  return { ok: true, value: updated };
}

export async function authenticateMember(email: string, password: string): Promise<ServiceResult<Member>> {
  const db = await getDb();
  const [m] = await db.select().from(members).where(eq(members.email, email.trim().toLowerCase())).limit(1);
  // Always run the hash to keep timing uniform.
  const ok = verifyPassword(password, m?.passwordHash ?? "scrypt$16384$00$00");
  if (!m || !ok) return { ok: false, error: "Incorrect email or password." };
  if (m.status !== "active") return { ok: false, error: "This membership is not active. Please contact the club." };
  return { ok: true, value: m };
}

export async function setMemberPassword(memberId: number, password: string): Promise<ServiceResult<null>> {
  const pwErr = validatePassword(password);
  if (pwErr) return { ok: false, error: pwErr };
  const db = await getDb();
  await db.update(members).set({ passwordHash: hashPassword(password), updatedAt: new Date() }).where(eq(members.id, memberId));
  return { ok: true, value: null };
}

export async function getMemberById(id: number): Promise<Member | null> {
  const db = await getDb();
  const [m] = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return m ?? null;
}

export async function getMemberByNumber(memberNumber: string): Promise<Member | null> {
  const db = await getDb();
  const [m] = await db.select().from(members).where(eq(members.memberNumber, memberNumber.trim().toUpperCase())).limit(1);
  return m ?? null;
}

export async function listMembers(): Promise<Member[]> {
  const db = await getDb();
  return db.select().from(members).orderBy(desc(members.createdAt));
}

export async function updateMember(
  id: number,
  patch: Partial<Pick<Member, "firstName" | "lastName" | "phone" | "tier" | "billing" | "status" | "renewsAt" | "lockerNumber" | "guestPassesRemaining" | "notes">>,
): Promise<void> {
  const db = await getDb();
  await db.update(members).set({ ...patch, updatedAt: new Date() }).where(eq(members.id, id));
}

export async function createMemberRequest(memberId: number, kind: RequestKind, details: string): Promise<MemberRequest> {
  const db = await getDb();
  const [row] = await db
    .insert(memberRequests)
    .values({ memberId, kind, details: details.trim().slice(0, 2000), status: "requested" })
    .returning();
  return row;
}

export type MemberRequestRow = { request: MemberRequest; member: Member };

export async function listMemberRequests(opts: { memberId?: number; openOnly?: boolean } = {}): Promise<MemberRequestRow[]> {
  const db = await getDb();
  const conds = [];
  if (opts.memberId) conds.push(eq(memberRequests.memberId, opts.memberId));
  if (opts.openOnly) conds.push(inArray(memberRequests.status, ["requested", "approved"]));
  return db
    .select({ request: memberRequests, member: members })
    .from(memberRequests)
    .innerJoin(members, eq(memberRequests.memberId, members.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(memberRequests.createdAt));
}

export async function updateMemberRequest(id: number, patch: { status?: string; staffNotes?: string | null }, opts: { memberId?: number } = {}): Promise<void> {
  const db = await getDb();
  const where = opts.memberId ? and(eq(memberRequests.id, id), eq(memberRequests.memberId, opts.memberId)) : eq(memberRequests.id, id);
  await db.update(memberRequests).set({ ...patch, updatedAt: new Date() }).where(where);
}

export type MemberBookingRow = { booking: Booking; experience: Experience };

export async function listMemberBookings(memberId: number, opts: { upcomingOnly?: boolean; now?: Date } = {}): Promise<MemberBookingRow[]> {
  const db = await getDb();
  const now = opts.now ?? new Date();
  const conds = [eq(bookings.memberId, memberId), inArray(bookings.status, ["confirmed", "pending"])];
  if (opts.upcomingOnly) conds.push(gt(bookings.endsAt, now));
  return db
    .select({ booking: bookings, experience: experiences })
    .from(bookings)
    .innerJoin(experiences, eq(bookings.experienceId, experiences.id))
    .where(and(...conds))
    .orderBy(asc(bookings.startsAt));
}

/**
 * Names on the Founders wall: members on the founders tier who are active or
 * still pending. Pending counts because a plate is spoken for the day the
 * application is accepted, not the day the portal login is activated.
 */
export async function foundersCount(): Promise<number> {
  const db = await getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(members)
    .where(and(eq(members.tier, "founders"), inArray(members.status, ["active", "pending"])));
  return row?.n ?? 0;
}

export async function memberStats(): Promise<{ total: number; active: number; pending: number; openRequests: number }> {
  const db = await getDb();
  const [m] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${members.status} = 'active')::int`,
      pending: sql<number>`count(*) filter (where ${members.status} = 'pending')::int`,
    })
    .from(members);
  const [r] = await db.select({ open: sql<number>`count(*)::int` }).from(memberRequests).where(inArray(memberRequests.status, ["requested", "approved"]));
  return { total: m?.total ?? 0, active: m?.active ?? 0, pending: m?.pending ?? 0, openRequests: r?.open ?? 0 };
}
