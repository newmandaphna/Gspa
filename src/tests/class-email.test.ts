import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

process.env.PGLITE_DATA_DIR = "memory://";
delete process.env.DATABASE_URL;
delete process.env.RESEND_API_KEY;

import { getDb } from "@/lib/db";
import { classMailOutbox } from "@/lib/db/class-mail-schema";
import { bookings, classSessions, experiences, type Booking, type Experience } from "@/lib/db/schema";
import { deliverClassMail, ensureClassMailSchema, enqueueClassMail, processClassMailQueue, reconcileClassMailOutbox } from "@/lib/class-mail";
import { cancellationText, confirmationText, reminderText } from "@/lib/email";
import type { EmailMessage } from "@/lib/email";

const START = new Date("2027-02-12T15:00:00Z");
const END = new Date("2027-02-12T18:30:00Z");
const NOW = new Date("2027-02-01T15:00:00Z");

function booking(): Booking {
  return {
    id: 9001,
    code: "GS-CLASS1",
    classSessionId: 42,
    mailingAddress: { line1: "PRIVATE HOME", city: "Queens", state: "NY", postalCode: "11434", country: "US" },
    attendees: [{ firstName: "PRIVATE", lastName: "ATTENDEE" }],
    classDetails: { title: "Defensive Handgun I", instructor: "Morgan Lee", requirements: "Eye and ear protection\n50 rounds of ammunition", collectId: true },
    experienceId: 7,
    resource: "training",
    startsAt: START,
    endsAt: END,
    guests: 2,
    units: 2,
    amountCents: 30000,
    status: "confirmed",
    paymentStatus: "paid",
    stripeSessionId: null,
    stripePaymentIntentId: null,
    firstName: "Ada",
    lastName: "Buyer",
    email: "ada@example.com",
    phone: "7185550100",
    memberNumber: null,
    memberId: null,
    notes: null,
    ackRequirements: true,
    reminderSentAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function experience(): Experience {
  return {
    id: 7,
    slug: "training",
    name: "Generic Training",
    category: "training",
    resource: "training",
    durationMin: 60,
    priceCents: 15000,
    maxGuestsPerUnit: 1,
    maxUnitsPerBooking: 4,
    tagline: "",
    description: "",
    includes: [],
    bookable: true,
    memberOnly: false,
    memberPriceCents: null,
    minTier: null,
    fixedUnits: null,
    extraGuestCents: null,
    eligibility: "handgun",
    sortOrder: 0,
    active: true,
  };
}

describe("scheduled class email", () => {
  it("uses the snapshotted class facts and never exposes attendee or mailing details", () => {
    const b = booking();
    const e = experience();
    const messages = [
      confirmationText(b, e, { now: NOW }),
      cancellationText({ ...b, status: "cancelled" }, e, "guest"),
      reminderText(b, e, new Date("2027-02-11T15:00:00Z")),
    ];
    for (const message of messages) {
      expect(message.text).toContain("Defensive Handgun I");
      expect(message.text).toContain("Fri, Feb 12, 10:00 AM");
      expect(message.text).not.toContain("PRIVATE HOME");
      expect(message.text).not.toContain("PRIVATE ATTENDEE");
    }
    expect(messages[0].text).toContain("Morgan Lee");
    expect(messages[0].text).toContain("210 minutes");
    expect(messages[0].text).toContain("Eye and ear protection");
    const ics = messages[0].attachments?.[0].content ?? "";
    expect(ics).toContain("SUMMARY:Defensive Handgun I at The Gun Spa");
    expect(ics).toContain("DTSTART;TZID=America/New_York:20270212T100000");
    expect(ics).toContain("DTEND;TZID=America/New_York:20270212T133000");
    expect(ics).toContain("Morgan Lee");
    expect(ics).toContain("Eye and ear protection");
    expect(ics).toContain("Rockaway Blvd");
    expect(ics).not.toContain("PRIVATE");
  });
});

describe("scheduled class mail outbox", () => {
  beforeEach(async () => {
    const db = await getDb();
    await ensureClassMailSchema(db);
    await db.delete(classMailOutbox);
  });

  it("delivers immediately after enqueue and deduplicates the event", async () => {
    const db = await getDb();
    const b = booking();
    const msg = confirmationText(b, experience(), { now: NOW });
    const keys: string[] = [];
    const opts = {
      db,
      now: new Date(Date.now() + 60_000),
      send: async (_kind: "confirmation" | "cancellation" | "reminder", _to: string, _message: EmailMessage, key: string) => {
        keys.push(key);
        return "sent" as const;
      },
    };
    expect(await deliverClassMail(b, "confirmation", msg, opts)).toBe("sent");
    expect(await deliverClassMail(b, "confirmation", msg, opts)).toBe("sent");
    expect(keys).toEqual(["class-booking:9001:confirmation"]);
    expect((await db.select().from(classMailOutbox))[0].status).toBe("sent");
  });

  it("does not mark skipped or refused delivery sent, and retries later", async () => {
    const db = await getDb();
    const b = booking();
    await enqueueClassMail(b, "reminder", reminderText(b, experience(), NOW), db);
    const skipped = await processClassMailQueue(db, { now: NOW, send: async () => "skipped" });
    expect(skipped.skipped).toBe(1);
    expect((await db.select().from(classMailOutbox))[0].status).toBe("pending");

    const retryAt = new Date(NOW.getTime() + 60_001);
    const refused = await processClassMailQueue(db, { now: retryAt, send: async () => "refused" });
    expect(refused.failed).toBe(1);
    expect((await db.select().from(classMailOutbox))[0].status).toBe("pending");

    const sent = await processClassMailQueue(db, { now: new Date(retryAt.getTime() + 60_001), send: async () => "sent" });
    expect(sent.sent).toBe(1);
    expect((await db.select().from(classMailOutbox))[0].status).toBe("sent");
  });

  it("reconciles a committed confirmed class booking whose enqueue was missed", async () => {
    const db = await getDb();
    const [catalog] = await db.select().from(experiences).limit(1);
    await db.insert(classSessions).values({
      id: 9901,
      experienceId: catalog.id,
      title: "Recovery Class",
      startsAt: START,
      endsAt: END,
      priceCents: 1000,
      capacity: 10,
      maxPerBooking: 2,
      status: "open",
    }).onConflictDoNothing();
    await db.insert(bookings).values({
      ...booking(),
      id: 9901,
      code: "GS-RECOV1",
      classSessionId: 9901,
      experienceId: catalog.id,
    }).onConflictDoNothing();

    const first = await reconcileClassMailOutbox(db);
    const second = await reconcileClassMailOutbox(db);
    expect(first.enqueued).toBeGreaterThanOrEqual(1);
    expect(second.enqueued).toBe(0);
    const rows = await db.select().from(classMailOutbox);
    expect(rows.filter((row) => row.eventKey === "class-booking:9901:confirmation")).toHaveLength(1);

    await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, 9901));
    const cancelled = await reconcileClassMailOutbox(db);
    expect(cancelled.enqueued).toBe(1);
    const afterCancel = await db.select().from(classMailOutbox);
    expect(afterCancel.filter((row) => row.eventKey === "class-booking:9901:cancellation")).toHaveLength(1);

    const bulkBookings = Array.from({ length: 501 }, (_, index) => ({
      ...booking(),
      id: 10000 + index,
      code: `GS-BULK${String(index).padStart(3, "0")}`,
      classSessionId: 9901,
      experienceId: catalog.id,
    }));
    await db.insert(bookings).values(bulkBookings).onConflictDoNothing();
    await db
      .insert(classMailOutbox)
      .values(
        bulkBookings.slice(0, 500).map((item) => ({
          bookingId: item.id,
          eventKey: `class-booking:${item.id}:confirmation`,
          kind: "confirmation",
          recipient: item.email,
          message: { subject: "existing", text: "existing", html: "existing" },
        })),
      )
      .onConflictDoNothing();
    await reconcileClassMailOutbox(db);
    const beyondFirstPage = await db
      .select()
      .from(classMailOutbox)
      .where(eq(classMailOutbox.eventKey, "class-booking:10500:confirmation"));
    expect(beyondFirstPage).toHaveLength(1);
  });

  it("suppresses queued confirmation and reminder mail when the booking is cancelled", async () => {
    const db = await getDb();
    const [catalog] = await db.select().from(experiences).limit(1);
    await db
      .insert(classSessions)
      .values({
        id: 9902,
        experienceId: catalog.id,
        title: "Cancelled Class",
        startsAt: START,
        endsAt: END,
        priceCents: 1000,
        capacity: 10,
        maxPerBooking: 2,
        status: "open",
      })
      .onConflictDoNothing();
    const b = { ...booking(), id: 9902, code: "GS-CANQ01", classSessionId: 9902, experienceId: catalog.id };
    await db.insert(bookings).values(b).onConflictDoNothing();
    await enqueueClassMail(b, "confirmation", confirmationText(b, catalog, { now: NOW }), db);
    await enqueueClassMail(b, "reminder", reminderText(b, catalog, NOW), db);
    await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, b.id));

    const sentKinds: string[] = [];
    await processClassMailQueue(db, {
      now: new Date(Date.now() + 60_000),
      limit: 10,
      send: async (kind) => {
        sentKinds.push(kind);
        return "sent";
      },
    });
    expect(sentKinds).toEqual([]);
    const cancelled: Booking = { ...b, status: "cancelled" };
    await enqueueClassMail(cancelled, "cancellation", cancellationText(cancelled, catalog, "guest"), db);
    await processClassMailQueue(db, {
      now: new Date(Date.now() + 60_000),
      limit: 10,
      send: async (kind) => {
        sentKinds.push(kind);
        return "sent";
      },
    });
    expect(sentKinds).toEqual(["cancellation"]);
    const rows = await db.select().from(classMailOutbox).where(eq(classMailOutbox.bookingId, b.id));
    expect(rows.find((row) => row.kind === "confirmation")?.status).toBe("suppressed");
    expect(rows.find((row) => row.kind === "reminder")?.status).toBe("suppressed");
  });
});