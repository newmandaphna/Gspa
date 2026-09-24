import { describe, expect, it } from "vitest";

process.env.PGLITE_DATA_DIR = "memory://";
delete process.env.DATABASE_URL;
delete process.env.RESEND_API_KEY;

import { createBooking, cancelBooking } from "@/lib/booking";
import { BOOKING, deskPhone, FACILITY, SITE } from "@/lib/config/site";
import { CATALOG } from "@/lib/content/catalog";
import { getDb } from "@/lib/db";
import type { Booking, Experience } from "@/lib/db/schema";
import { cancellationText, confirmationText, icsFor, googleCalendarUrlFor, reminderText, requestedLane, toResendAttachments } from "@/lib/email";
import { buildIcs, escapeText, foldLine, googleCalendarUrl, localStamp } from "@/lib/ics";
import { claimReminder, listDueReminders, releaseReminder, reminderWindow, runReminders } from "@/lib/reminders";
import { addDaysIso, todayIso, zonedToUtc } from "@/lib/time";

const NOW = new Date("2026-10-05T14:00:00Z"); // Monday 10:00 AM New York (EDT)
const lane = CATALOG.find((c) => c.bookable && c.resource === "lane")!;

/** A booking as the database would hand it back, without touching the database. */
function fakeBooking(over: Partial<Booking> = {}): Booking {
  const startsAt = zonedToUtc("2026-10-08", "20:30"); // Thursday 8:30 PM EDT
  return {
    id: 1,
    code: "GS-TEST01",
    experienceId: 1,
    classSessionId: null,
    mailingAddress: null,
    attendees: null,
    classDetails: null,
    resource: "lane",
    startsAt,
    endsAt: new Date(startsAt.getTime() + 60 * 60_000),
    guests: 2,
    units: 1,
    amountCents: 9000,
    status: "confirmed",
    paymentStatus: "pay_on_arrival",
    stripeSessionId: null,
    stripePaymentIntentId: null,
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "+1 718 555 0100",
    memberNumber: null,
    memberId: null,
    notes: null,
    ackRequirements: true,
    reminderSentAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  };
}

function fakeExperience(over: Partial<Experience> = {}): Experience {
  return {
    id: 1,
    slug: lane.slug,
    name: lane.name,
    category: lane.category,
    resource: lane.resource,
    durationMin: 60,
    priceCents: lane.priceCents,
    maxGuestsPerUnit: lane.maxGuestsPerUnit,
    maxUnitsPerBooking: lane.maxUnitsPerBooking,
    tagline: "",
    description: "",
    includes: [],
    bookable: true,
    memberOnly: false,
    memberPriceCents: null,
    minTier: null,
    fixedUnits: null,
    extraGuestCents: null,
    eligibility: lane.eligibility,
    sortOrder: 0,
    active: true,
    ...over,
  };
}

const DASHES = /[–—]/;

describe("ics", () => {
  it("writes the start in New York wall-clock time with a VTIMEZONE block", () => {
    const ics = icsFor(fakeBooking(), fakeExperience(), NOW);
    expect(ics).toContain("BEGIN:VTIMEZONE\r\nTZID:America/New_York");
    expect(ics).toContain("TZOFFSETTO:-0400\r\nTZNAME:EDT");
    expect(ics).toContain("TZOFFSETTO:-0500\r\nTZNAME:EST");
    expect(ics).toContain("DTSTART;TZID=America/New_York:20261008T203000");
    expect(ics).toContain("DTEND;TZID=America/New_York:20261008T213000");
    expect(ics).toContain("DTSTAMP:20261005T140000Z");
    expect(ics).toContain(`UID:GS-TEST01@${SITE.domain}`);
    expect(ics).toContain("LOCATION:The Gun Spa\\, 158-12 Rockaway Blvd\\, Jamaica\\, NY 11434");
    expect(ics).toContain("/reserve/confirmation/GS-TEST01");
    // Every line ends in CRLF and none runs past 75 octets.
    const lines = ics.split("\r\n");
    expect(ics.endsWith("\r\n")).toBe(true);
    for (const l of lines) expect(Buffer.byteLength(l, "utf8")).toBeLessThanOrEqual(75);
    expect(ics).not.toMatch(/[^\r]\n/);
  });

  it("sets the alarm one hour before the free cancellation window closes", () => {
    const ics = icsFor(fakeBooking(), fakeExperience(), NOW);
    const alarm = ics.slice(ics.indexOf("BEGIN:VALARM"), ics.indexOf("END:VALARM"));
    expect(alarm).toContain("DESCRIPTION:Last hour to cancel free");
    expect(alarm).toContain(`TRIGGER:-PT${BOOKING.freeCancelHours + 1}H`);
    const suite = icsFor(fakeBooking(), fakeExperience({ slug: "private-suite", category: "suite" }), NOW);
    expect(suite).toContain(`TRIGGER:-PT${BOOKING.suiteFreeCancelHours + 1}H`);
  });

  it("handles a winter start (EST) and the same instant in the Google link", () => {
    const start = zonedToUtc("2027-01-15", "19:00");
    const b = fakeBooking({ startsAt: start, endsAt: new Date(start.getTime() + 60 * 60_000) });
    expect(localStamp(start)).toBe("20270115T190000");
    expect(icsFor(b, fakeExperience(), NOW)).toContain("DTSTART;TZID=America/New_York:20270115T190000");
    const g = new URL(googleCalendarUrlFor(b, fakeExperience()));
    expect(g.hostname).toBe("calendar.google.com");
    expect(g.searchParams.get("dates")).toBe("20270116T000000Z/20270116T010000Z");
    expect(g.searchParams.get("ctz")).toBe("America/New_York");
    expect(g.searchParams.get("location")).toContain("Rockaway Blvd");
  });

  it("escapes and folds text values", () => {
    expect(escapeText("a,b;c\\d\nend")).toBe("a\\,b\\;c\\\\d\\nend");
    const long = "SUMMARY:" + "x".repeat(200);
    const folded = foldLine(long);
    expect(folded.split("\r\n ").length).toBeGreaterThan(2);
    expect(folded.replace(/\r\n /g, "")).toBe(long);
    const ics = buildIcs({ uid: "u@x", start: NOW, end: NOW, summary: "Café, 8:30", stamp: NOW });
    expect(ics).toContain("SUMMARY:Café\\, 8:30");
    expect(googleCalendarUrl({ start: NOW, end: NOW, summary: "A & B" })).toContain("text=A+%26+B");
  });
});

describe("email copy", () => {
  const b = fakeBooking({ notes: "Lane 07 requested." });
  const e = fakeExperience();

  it("confirmation carries the calendar file, the map, the lane and the cancel window", () => {
    const msg = confirmationText(b, e, { host: { name: "Sam", until: "10 PM" }, now: NOW });
    expect(msg.subject).toContain("GS-TEST01");
    expect(msg.attachments?.[0].filename).toBe("gun-spa-GS-TEST01.ics");
    expect(msg.attachments?.[0].content).toContain("BEGIN:VCALENDAR");
    expect(msg.html).toContain("/email/wordmark@2x.png");
    expect(msg.html).toContain(SITE.address.googleMapsUrl.replace("&", "&amp;"));
    expect(msg.html).toContain("calendar.google.com");
    expect(msg.html).toContain("Lane 07, 8:30 PM");
    expect(msg.html).toContain("Tonight&#39;s host: Sam, until 10 PM.");
    expect(msg.text).toContain("Free cancellation until Wed, Oct 7, 8:30 PM, 24 hours before you start.");
    expect(msg.text).toContain("Reply to this email and a person at the desk answers.");
    expect(msg.text).toContain("Bring a valid government photo ID.");
    expect(msg.headers).toBeUndefined();
    expect(msg.text).not.toMatch(DASHES);
    expect(msg.html).not.toMatch(DASHES);
    // No host line unless one is set.
    expect(confirmationText(b, e, { now: NOW }).text).not.toContain("Tonight");
  });

  it("confirmation never promises a cutoff that has passed, and drops the calendar alarm with it", () => {
    // Booked 20 hours out: inside the 24-hour window from the moment it is confirmed.
    const late = new Date(b.startsAt.getTime() - 20 * 3_600_000);
    const msg = confirmationText(b, e, { now: late });
    expect(msg.text).not.toContain("Free cancellation until");
    expect(msg.text).toContain("Online cancellation has already closed for this reservation.");
    expect(msg.html).toContain("Online cancellation has already closed for this reservation.");
    expect(msg.html).not.toContain("nudge an hour before");
    expect(msg.attachments?.[0].content).not.toContain("BEGIN:VALARM");
    expect(icsFor(b, e, late)).not.toContain("BEGIN:VALARM");
    // Two days out the promise and the alarm are both real.
    const early = confirmationText(b, e, { now: NOW });
    expect(early.text).toContain("Free cancellation until Wed, Oct 7, 8:30 PM");
    expect(early.attachments?.[0].content).toContain("BEGIN:VALARM");
    expect(msg.text).not.toMatch(DASHES);
  });

  it("prints the desk phone only once the owner has set a real one", () => {
    const phone = deskPhone();
    const messages = [
      confirmationText(b, e, { now: NOW }),
      confirmationText(b, e, { now: new Date(b.startsAt.getTime() - 20 * 3_600_000) }),
      cancellationText(fakeBooking({ status: "cancelled" }), e, "guest"),
      reminderText(b, e, new Date(b.startsAt.getTime() - 30 * 3_600_000)),
      reminderText(b, e, new Date(b.startsAt.getTime() - 20 * 3_600_000)),
    ];
    for (const m of messages) {
      expect(m.text).not.toContain("000-0000");
      expect(m.html).not.toContain("000-0000");
      if (phone) {
        expect(m.text).toContain(phone);
      } else {
        expect(m.text).not.toMatch(/\bcall\b/i);
        expect(m.text).toContain("Reply to this email and a person at the desk answers.");
      }
    }
    if (!phone) {
      expect(messages[0].text).toContain("After that, reply to this email and the desk will sort it out.");
      expect(messages[4].text).toContain("Reply to this email and the desk will sort it out.");
    }
  });

  it("only honours a requested lane that is real and belongs to a lane booking", () => {
    expect(requestedLane("Lane 07 requested.", e)).toBe("07");
    expect(requestedLane(`Lane ${String(FACILITY.laneCount).padStart(2, "0")} requested.`, e)).toBe(String(FACILITY.laneCount).padStart(2, "0"));
    expect(requestedLane("Lane 99 requested.", e)).toBeNull();
    expect(requestedLane("Lane 00 requested.", e)).toBeNull();
    expect(requestedLane("Lane 07 requested. Please put us near the door.", e)).toBe("07");
    expect(requestedLane("Please put us in Lane 07 requested.", e)).toBeNull();
    expect(requestedLane("Lane 07 requested.", { resource: "simulator" })).toBeNull();
    expect(requestedLane(null, e)).toBeNull();
    // A guest who types a fake lane into the notes gets no lane line in the email or the calendar file.
    const typed = fakeBooking({ notes: "Lane 99 requested." });
    expect(confirmationText(typed, e, { now: NOW }).text).not.toContain("Lane 99");
    expect(icsFor(typed, e, NOW)).not.toContain("Lane 99");
    expect(reminderText(typed, e, NOW).text).not.toContain("Lane 99");
  });

  it("cancellation reads differently for a guest cancel and an expired hold", () => {
    const guest = cancellationText(fakeBooking({ status: "cancelled", paymentStatus: "refunded", stripePaymentIntentId: "pi_1" }), e, "guest");
    expect(guest.subject).toContain("is cancelled");
    expect(guest.text).toContain("Stripe has been asked to return $90 to your card.");
    const arrival = cancellationText(fakeBooking({ status: "cancelled" }), e, "guest");
    expect(arrival.text).toContain("Nothing was charged.");
    const expired = cancellationText(fakeBooking({ status: "cancelled", paymentStatus: "unpaid" }), e, "expired");
    expect(expired.subject).toContain("hold");
    expect(expired.text).toContain(`did not complete within ${BOOKING.pendingHoldMin} minutes`);
    expect(expired.text).toContain("Nothing was charged.");
    for (const m of [guest, arrival, expired]) {
      expect(m.text).not.toMatch(DASHES);
      expect(m.html).not.toMatch(DASHES);
      expect(m.attachments).toBeUndefined();
    }
  });

  it("reminder says tomorrow, tells the truth about the cancel window, and carries List-Unsubscribe", () => {
    const open = reminderText(b, e, new Date(b.startsAt.getTime() - 30 * 3_600_000));
    expect(open.subject).toBe(`Tomorrow at 8:30 PM: ${e.name} at The Gun Spa`);
    expect(open.text).toContain("Free cancellation is open until Wed, Oct 7, 8:30 PM.");
    const closed = reminderText(b, e, new Date(b.startsAt.getTime() - 20 * 3_600_000));
    expect(closed.text).toContain("Online cancellation has closed for this reservation.");
    expect(open.headers?.["List-Unsubscribe"]).toBe(`<mailto:${SITE.email}?subject=STOP%20reminders%20GS-TEST01>`);
    expect(open.text).toContain("More than 20 minutes late counts as a no-show.");
    expect(open.html).toContain(SITE.address.googleMapsUrl.replace("&", "&amp;"));
    expect(open.text).not.toMatch(DASHES);
    expect(open.html).not.toMatch(DASHES);
  });
});

describe("reminder selection (in-memory Postgres)", () => {
  const today = todayIso(undefined, NOW);
  const tomorrow = addDaysIso(today, 1);
  const dayAfter = addDaysIso(today, 2);
  const base = {
    experienceSlug: lane.slug,
    guests: 1,
    firstName: "Ada",
    lastName: "Lovelace",
    phone: "+1 718 555 0100",
    ackRequirements: true,
    paymentMode: "on_arrival" as const,
    now: NOW,
  };

  it("covers tomorrow in New York, midnight to midnight", () => {
    const w = reminderWindow(NOW);
    expect(w.dateISO).toBe("2026-10-06");
    expect(w.from.toISOString()).toBe("2026-10-06T04:00:00.000Z");
    expect(w.to.toISOString()).toBe("2026-10-07T04:00:00.000Z");
    // Late in the evening it is still today's run, so the window is still tomorrow.
    expect(reminderWindow(new Date("2026-10-06T02:30:00Z")).dateISO).toBe("2026-10-06");
  });

  it("picks confirmed bookings starting tomorrow, once each", async () => {
    const db = await getDb();
    const tmr = await createBooking({ ...base, date: tomorrow, time: "19:00", email: "tomorrow@example.com" });
    const morning = await createBooking({ ...base, date: tomorrow, time: "10:00", email: "morning@example.com" });
    const later = await createBooking({ ...base, date: dayAfter, time: "19:00", email: "later@example.com" });
    const gone = await createBooking({ ...base, date: tomorrow, time: "15:00", email: "gone@example.com" });
    const held = await createBooking({ ...base, date: tomorrow, time: "16:00", email: "held@example.com", paymentMode: "stripe" });
    expect([tmr, morning, later, gone, held].every((r) => r.ok)).toBe(true);
    if (!gone.ok) return;
    expect((await cancelBooking(gone.booking.code, { email: "gone@example.com", now: NOW })).ok).toBe(true);

    const due = await listDueReminders(db, NOW);
    expect(due.map((r) => r.booking.email)).toEqual(["morning@example.com", "tomorrow@example.com"]);

    // No RESEND_API_KEY in tests: nothing goes out and nothing is stamped, so the guests stay due.
    const dry = await runReminders(NOW, { pauseMs: 0 });
    expect(dry.sent).toEqual([]);
    expect(dry.skipped.length).toBe(2);
    expect((await listDueReminders(db, NOW)).length).toBe(2);

    // A refused send is released for a retry the same day.
    const refused = await runReminders(NOW, { pauseMs: 0, send: async (b) => (b.email === "morning@example.com" ? "refused" : "sent") });
    expect(refused.failed.length).toBe(1);
    expect(refused.sent.length).toBe(1);
    expect((await listDueReminders(db, NOW)).map((r) => r.booking.email)).toEqual(["morning@example.com"]);

    const run = await runReminders(NOW, { pauseMs: 0, send: async () => "sent" });
    expect(run.window).toBe(tomorrow);
    expect(run.sent.length).toBe(1);
    expect(run.failed).toEqual([]);
    expect(await listDueReminders(db, NOW)).toEqual([]);
    const again = await runReminders(NOW, { pauseMs: 0, send: async () => "sent" });
    expect(again.due).toBe(0);

    // The day after, the remaining booking comes up.
    const nextDay = new Date(NOW.getTime() + 24 * 3_600_000);
    const nextDue = await listDueReminders(db, nextDay);
    expect(nextDue.map((r) => r.booking.email)).toEqual(["later@example.com"]);
  });

  it("claims a booking before mailing it, so overlapping runs send once", async () => {
    const db = await getDb();
    const twoDays = addDaysIso(today, 4);
    const at = new Date(NOW.getTime() + 3 * 24 * 3_600_000);
    const res = await createBooking({ ...base, date: twoDays, time: "12:00", email: "twice@example.com" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(await claimReminder(db, res.booking.id, at)).toBe(true);
    expect(await claimReminder(db, res.booking.id, at)).toBe(false);
    await releaseReminder(db, res.booking.id);
    expect(await claimReminder(db, res.booking.id, at)).toBe(true);

    // Two runs started together: each booking is mailed by exactly one of them.
    await releaseReminder(db, res.booking.id);
    const mailed: string[] = [];
    const send = async (b: Booking) => {
      mailed.push(b.code);
      return "sent" as const;
    };
    const [a, b] = await Promise.all([runReminders(at, { pauseMs: 0, send }), runReminders(at, { pauseMs: 0, send })]);
    expect(a.sent.length + b.sent.length).toBe(1);
    expect(mailed).toEqual([res.booking.code]);
  });

  it("hands Resend the calendar file as bytes, not text", () => {
    const msg = confirmationText(fakeBooking(), fakeExperience(), { now: NOW });
    const [file] = toResendAttachments(msg.attachments!);
    expect(Buffer.isBuffer(file.content)).toBe(true);
    expect(file.content.toString("utf8")).toContain("BEGIN:VCALENDAR");
    expect(file.filename).toBe("gun-spa-GS-TEST01.ics");
  });
});
