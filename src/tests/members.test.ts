import { beforeAll, describe, expect, it } from "vitest";

process.env.PGLITE_DATA_DIR = "memory://";
process.env.SESSION_SECRET = "test-secret";
delete process.env.DATABASE_URL;

import { getDb } from "@/lib/db";
import { generateActivationCode, hashPassword, normalizeCode, passwordFingerprint, signMemberSession, verifyMemberSession, verifyPassword } from "@/lib/members/crypto";
import { activateMember, authenticateMember, createMember, createMemberRequest, getMemberByNumber, listMemberBookings, listMemberRequests, toContext, updateMemberRequest } from "@/lib/members/service";
import { createBooking, getAvailability } from "@/lib/booking";
import { CATALOG } from "@/lib/content/catalog";
import { addDaysIso, todayIso } from "@/lib/time";

describe("member crypto", () => {
  it("hashes and verifies passwords", () => {
    const h = hashPassword("correct horse battery");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("correct horse battery", h)).toBe(true);
    expect(verifyPassword("wrong", h)).toBe(false);
    expect(verifyPassword("x", null)).toBe(false);
  });

  it("signs and verifies sessions with expiry, bound to the password hash", () => {
    const hash = hashPassword("first");
    const t = signMemberSession(42, hash, 1_000_000, 3600);
    expect(verifyMemberSession(t, 1_000_100)).toEqual({ id: 42, fingerprint: passwordFingerprint(hash) });
    expect(verifyMemberSession(t, 1_004_000)).toBeNull();
    expect(verifyMemberSession(t.slice(0, -2) + "zz", 1_000_100)).toBeNull();
    expect(verifyMemberSession("garbage", 1)).toBeNull();
    // A new password (fresh salt) changes the fingerprint, so older tokens no longer match the member.
    expect(passwordFingerprint(hashPassword("first"))).not.toBe(passwordFingerprint(hash));
    // Old three-part tokens are rejected outright.
    expect(verifyMemberSession("42.9999999999.sig", 1)).toBeNull();
  });

  it("generates and normalizes activation codes", () => {
    const c = generateActivationCode();
    expect(c).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(normalizeCode(" k7mp 2q9x ")).toBe("K7MP-2Q9X");
  });
});

describe("member lifecycle (in-memory Postgres)", () => {
  const NOW = new Date("2026-10-05T14:00:00Z");
  const DAY = addDaysIso(todayIso(undefined, NOW), 2);

  beforeAll(async () => {
    await getDb();
  }, 30_000);

  it("creates, activates, authenticates and books member-only experiences", async () => {
    const created = await createMember({ firstName: "Grace", lastName: "Hopper", email: "Grace@Example.com", tier: "signature", billing: "annual", guestPasses: 4 });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const { member, activationCode } = created.value;
    expect(member.memberNumber).toMatch(/^GS-M-\d{4,}$/);
    expect(member.email).toBe("grace@example.com");

    const dup = await createMember({ firstName: "G", lastName: "H", email: "grace@example.com", tier: "club", billing: "annual" });
    expect(dup.ok).toBe(false);

    const bad = await activateMember({ email: "grace@example.com", activationCode: "AAAA-AAAA", password: "longenough1" });
    expect(bad.ok).toBe(false);
    const short = await activateMember({ email: "grace@example.com", activationCode, password: "short" });
    expect(short.ok).toBe(false);
    const act = await activateMember({ email: "grace@example.com", activationCode: activationCode.toLowerCase(), password: "longenough1" });
    expect(act.ok).toBe(true);

    expect((await authenticateMember("grace@example.com", "nope")).ok).toBe(false);
    const auth = await authenticateMember("GRACE@example.com", "longenough1");
    expect(auth.ok).toBe(true);
    if (!auth.ok) return;
    const ctx = toContext(auth.value);

    const memberOnly = CATALOG.find((c) => c.memberOnly && c.bookable && !c.minTier);
    expect(memberOnly).toBeDefined();
    if (!memberOnly) return;

    // Anonymous visitors can't see or book it.
    expect(await getAvailability(memberOnly.slug, DAY, { now: NOW })).toBeNull();
    const anon = await createBooking({
      experienceSlug: memberOnly.slug, date: DAY, time: "12:00", guests: 1, firstName: "A", lastName: "B", email: "a@b.co", phone: "7185550100", ackRequirements: true, paymentMode: "on_arrival", now: NOW,
    });
    expect(anon.ok).toBe(false);
    if (!anon.ok) expect(anon.code).toBe("MEMBERS_ONLY");

    // Members can, at member pricing, and the booking is linked to them.
    const avail = await getAvailability(memberOnly.slug, DAY, { now: NOW, member: ctx });
    expect(avail?.open).toBe(true);
    const slot = avail!.slots[0];
    const res = await createBooking({
      experienceSlug: memberOnly.slug, date: DAY, time: slot.time, guests: 1, firstName: ctx.firstName, lastName: ctx.lastName, email: ctx.email, phone: "7185550100", ackRequirements: true, paymentMode: "on_arrival", now: NOW, member: ctx,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.booking.memberId).toBe(ctx.id);
    expect(res.booking.memberNumber).toBe(ctx.memberNumber);
    expect(res.booking.amountCents).toBe((memberOnly.memberPriceCents ?? memberOnly.priceCents) * res.booking.units);

    // An included ($0) service never goes to Stripe: it confirms immediately even in stripe mode.
    if (memberOnly.memberPriceCents === 0) {
      const included = await createBooking({
        experienceSlug: memberOnly.slug, date: DAY, time: avail!.slots[1].time, guests: 1, firstName: ctx.firstName, lastName: ctx.lastName, email: ctx.email, phone: "7185550100", ackRequirements: true, paymentMode: "stripe", now: NOW, member: ctx,
      });
      expect(included.ok).toBe(true);
      if (included.ok) {
        expect(included.booking.amountCents).toBe(0);
        expect(included.booking.status).toBe("confirmed");
        expect(included.booking.paymentStatus).toBe("pay_on_arrival");
      }
    }

    const mine = await listMemberBookings(ctx.id, { upcomingOnly: true, now: NOW });
    expect(mine.map((r) => r.booking.code)).toContain(res.booking.code);

    // A public lane at member price when a member is signed in.
    const lane = CATALOG.find((c) => !c.memberOnly && c.bookable && c.memberPriceCents != null);
    if (lane) {
      const r2 = await createBooking({
        experienceSlug: lane.slug, date: DAY, time: "14:00", guests: 1, firstName: "G", lastName: "H", email: ctx.email, phone: "7185550100", ackRequirements: true, paymentMode: "on_arrival", now: NOW, member: ctx,
      });
      expect(r2.ok).toBe(true);
      if (r2.ok) expect(r2.booking.amountCents).toBe(lane.memberPriceCents! * r2.booking.units);
    }

    // Tier gating.
    const gated = CATALOG.find((c) => c.minTier === "founders" && c.bookable);
    if (gated) {
      const g = await createBooking({
        experienceSlug: gated.slug, date: DAY, time: "14:00", guests: 1, firstName: "G", lastName: "H", email: ctx.email, phone: "7185550100", ackRequirements: true, paymentMode: "on_arrival", now: NOW, member: ctx,
      });
      expect(g.ok).toBe(false);
    }
  });

  it("validates a typed member number for the extended booking window", async () => {
    const created = await createMember({ firstName: "Ada", lastName: "Byron", email: "ada@example.com", tier: "founders", billing: "lifetime" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const num = created.value.member.memberNumber;
    expect(await getMemberByNumber(num.toLowerCase())).not.toBeNull();
    const lane = CATALOG.find((c) => !c.memberOnly && c.bookable)!;
    // 25 days out: beyond the 7-day public window, inside the 30-day Founders window.
    const far = addDaysIso(todayIso(undefined, NOW), 25);
    const fake = await createBooking({
      experienceSlug: lane.slug, date: far, time: "12:00", guests: 1, firstName: "X", lastName: "Y", email: "x@y.co", phone: "7185550100", ackRequirements: true, paymentMode: "on_arrival", now: NOW, memberNumber: "GS-M-9999999",
    });
    expect(fake.ok).toBe(false);
    // The right number with someone else's email is refused, so a number seen on a confirmation cannot be borrowed.
    const borrowed = await createBooking({
      experienceSlug: lane.slug, date: far, time: "12:00", guests: 1, firstName: "X", lastName: "Y", email: "x@y.co", phone: "7185550100", ackRequirements: true, paymentMode: "on_arrival", now: NOW, memberNumber: num,
    });
    expect(borrowed.ok).toBe(false);
    if (!borrowed.ok) expect(borrowed.code).toBe("INVALID");
    const real = await createBooking({
      experienceSlug: lane.slug, date: far, time: "12:00", guests: 1, firstName: "Ada", lastName: "Byron", email: "Ada@Example.com", phone: "7185550100", ackRequirements: true, paymentMode: "on_arrival", now: NOW, memberNumber: num,
    });
    expect(real.ok).toBe(true);
    if (real.ok) expect(real.booking.memberNumber).toBe(num);
  });

  it("tracks member requests", async () => {
    const created = await createMember({ firstName: "Lin", lastName: "Chen", email: "lin@example.com", tier: "founders", billing: "lifetime" });
    if (!created.ok) throw new Error(created.error);
    const req = await createMemberRequest(created.value.member.id, "locker", "Full-height locker near the suites, please.");
    expect(req.status).toBe("requested");
    await updateMemberRequest(req.id, { status: "approved", staffNotes: "Locker 12" });
    const rows = await listMemberRequests({ memberId: created.value.member.id });
    expect(rows[0].request.status).toBe("approved");
    // Another member can't touch it.
    await updateMemberRequest(req.id, { status: "cancelled" }, { memberId: 999_999 });
    expect((await listMemberRequests({ memberId: created.value.member.id }))[0].request.status).toBe("approved");
  });
});
