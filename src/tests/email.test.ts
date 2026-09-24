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
  const HOUR = 3_600_000;
  const today = todayIso(undefined, NOW);
  const tomorrow = addDaysIso(today, 1);
  const dayAfter = addDaysIso(today, 2);
  const dayThree = addDaysIso(today, 3);
  /** Reservations in these tests were made three days before NOW unless a test says otherwise. */
  const MADE = new Date(NOW.getTime() - 3 * 24 * HOUR);
  const base = {
    experienceSlug: lane.slug,
    guests: 1,
    firstName: "Ada",
    lastName: "Lovelace",
    phone: "+1 718 555 0100",
    ackRequirements: true,
    paymentMode: "on_arrival" as const,
    now: MADE,
  };

  it("covers 12 to 25 hours ahead and rolls with the clock", () => {
    const w = reminderWindow(NOW);
    expect(w.from.toISOString()).toBe("2026-10-06T02:00:00.000Z");
    expect(w.to.toISOString()).toBe("2026-10-06T15:00:00.000Z");
    expect(w.label).toBe("2026-10-06T02:00:00.000Z/2026-10-06T15:00:00.000Z");
    const later = reminderWindow(new Date(NOW.getTime() + HOUR));
    expect(later.from.getTime() - w.from.getTime()).toBe(HOUR);
    expect(later.to.getTime() - w.to.getTime()).toBe(HOUR);
  });

  it("picks confirmed bookings about a day away that were made a day or more ahead, once each", async () => {
    const db = await getDb();
    // 10:00 tomorrow is 24 hours away: due now.
    const tmr = await createBooking({ ...base, date: tomorrow, time: "10:00", email: "tomorrow@example.com" });
    // 19:00 tomorrow is 33 hours away: due in eight hours, not now.
    const evening = await createBooking({ ...base, date: tomorrow, time: "19:00", email: "evening@example.com" });
    // 20:00 today is 10 hours away: under the 12 hour floor, so a run that missed it stays quiet.
    const soon = await createBooking({ ...base, date: today, time: "20:00", email: "soon@example.com" });
    // Made 23 and a half hours before it starts: its confirmation is fresh, so no reminder ever.
    const late = await createBooking({ ...base, date: tomorrow, time: "10:00", email: "late@example.com", now: new Date(NOW.getTime() + 30 * 60_000) });
    const gone = await createBooking({ ...base, date: tomorrow, time: "15:00", email: "gone@example.com" });
    const held = await createBooking({ ...base, date: tomorrow, time: "16:00", email: "held@example.com", paymentMode: "stripe" });
    expect([tmr, evening, soon, late, gone, held].every((r) => r.ok)).toBe(true);
    if (!gone.ok) return;
    expect((await cancelBooking(gone.booking.code, { email: "gone@example.com", now: NOW })).ok).toBe(true);

    const due = await listDueReminders(db, NOW);
    expect(due.map((r) => r.booking.email)).toEqual(["tomorrow@example.com"]);

    // No RESEND_API_KEY in tests: nothing goes out and nothing is stamped, so the guest stays due.
    const dry = await runReminders(NOW, { pauseMs: 0 });
    expect(dry.sent).toEqual([]);
    expect(dry.skipped.length).toBe(1);
    expect((await listDueReminders(db, NOW)).length).toBe(1);

    // A refused send is released for the next hourly run.
    const refused = await runReminders(NOW, { pauseMs: 0, send: async () => "refused" });
    expect(refused.failed.length).toBe(1);
    expect((await listDueReminders(db, NOW)).map((r) => r.booking.email)).toEqual(["tomorrow@example.com"]);

    const run = await runReminders(NOW, { pauseMs: 0, send: async () => "sent" });
    expect(run.window).toBe(reminderWindow(NOW).label);
    expect(run.sent.length).toBe(1);
    expect(run.failed).toEqual([]);
    expect(await listDueReminders(db, NOW)).toEqual([]);
    const again = await runReminders(NOW, { pauseMs: 0, send: async () => "sent" });
    expect(again.due).toBe(0);

    // Nine hours on, the evening reservation is 24 hours away and comes up; the others never do.
    const nineLater = new Date(NOW.getTime() + 9 * HOUR);
    expect((await listDueReminders(db, nineLater)).map((r) => r.booking.email)).toEqual(["evening@example.com"]);
    expect(await runReminders(nineLater, { pauseMs: 0, send: async () => "sent" })).toMatchObject({ sent: [evening.ok ? evening.booking.code : ""] });
    for (let h = 10; h <= 40; h++) {
      expect(await listDueReminders(db, new Date(NOW.getTime() + h * HOUR))).toEqual([]);
    }
  });

  it("reminds each booking exactly once under hourly runs, 24 to 25 hours ahead, and catches up after missed runs", async () => {
    const madeEarlier = new Date(NOW.getTime() - 2 * 24 * HOUR);
    const seeds: Array<[string, string]> = [
      [dayAfter, "10:00"], // 48 hours out: first due at run 24
      [dayAfter, "13:00"], // 51 hours out: first due at run 27, inside the outage
      [dayAfter, "18:00"], // 56 hours out: first due at run 32, the first run after the outage
      [dayThree, "11:00"], // 73 hours out: first due at run 49
      [dayThree, "20:00"], // 82 hours out: first due at run 58
    ];
    const starts = new Map<string, Date>();
    for (const [i, [date, time]] of seeds.entries()) {
      const res = await createBooking({ ...base, now: madeEarlier, date, time, email: `hourly-${i}@example.com` });
      expect(res.ok).toBe(true);
      if (res.ok) starts.set(res.booking.code, res.booking.startsAt);
    }

    const sends = new Map<string, Date[]>();
    const send = async (b: Booking, _e: Experience, at: Date) => {
      sends.set(b.code, [...(sends.get(b.code) ?? []), at]);
      return "sent" as const;
    };
    // Hourly for three and a half days, except a six hour outage in which runs 26 through 31 never happen.
    for (let h = 0; h <= 84; h++) {
      if (h >= 26 && h <= 31) continue;
      await runReminders(new Date(NOW.getTime() + h * HOUR), { pauseMs: 0, send });
    }

    // Nothing at all was mailed twice, including leftovers from the other tests.
    for (const times of sends.values()) expect(times.length).toBe(1);
    const leadHours = (code: string) => (starts.get(code)!.getTime() - sends.get(code)![0].getTime()) / HOUR;
    const [first, inOutage, afterOutage, third, fourth] = [...starts.keys()];
    for (const code of [first, afterOutage, third, fourth]) {
      expect(sends.get(code)?.length).toBe(1);
      expect(leadHours(code)).toBeGreaterThanOrEqual(24);
      expect(leadHours(code)).toBeLessThan(25);
    }
    // The one that fell due during the outage went out on the first run after it, 19 hours ahead, once.
    expect(sends.get(inOutage)?.length).toBe(1);
    expect(leadHours(inOutage)).toBe(19);
  });

  it("claims a booking before mailing it, so overlapping runs send once", async () => {
    const db = await getDb();
    const fourDays = addDaysIso(today, 4);
    const at = new Date(NOW.getTime() + 3 * 24 * HOUR + 2 * HOUR); // 24 hours before the noon slot
    const res = await createBooking({ ...base, date: fourDays, time: "12:00", email: "twice@example.com" });
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
