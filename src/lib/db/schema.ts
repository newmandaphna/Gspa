import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Bookable products. Seeded from src/lib/content/catalog.ts (upsert by slug),
 * so editing that file is how the owner changes the catalog.
 */
export const experiences = pgTable("experiences", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // lane | suite | training | experience | event
  resource: text("resource").notNull(), // key of RESOURCES in config/site.ts
  durationMin: integer("duration_min").notNull(),
  priceCents: integer("price_cents").notNull(), // per unit (lane / suite / seat)
  maxGuestsPerUnit: integer("max_guests_per_unit").notNull().default(1),
  maxUnitsPerBooking: integer("max_units_per_booking").notNull().default(4),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  includes: jsonb("includes").$type<string[]>().notNull().default([]),
  bookable: boolean("bookable").notNull().default(true),
  /** Only signed-in members can see and book this. */
  memberOnly: boolean("member_only").notNull().default(false),
  /** Price for signed-in members (null = same as public). */
  memberPriceCents: integer("member_price_cents"),
  /** Minimum tier key required (null = any member / public). */
  minTier: text("min_tier"),
  /** Always consumes this many units at a flat price (Founders' Suite = both suites). */
  fixedUnits: integer("fixed_units"),
  /** Price per guest beyond one per unit (second student at 50%). */
  extraGuestCents: integer("extra_guest_cents"),
  /** Who can take part: handgun | longgun | simulator | anyone. Rendered as a badge; rules live in requirements.ts. */
  eligibility: text("eligibility").notNull().default("anyone"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

/**
 * Club members. Created by staff after vetting; the member activates their
 * login with a one-time activation code, then signs in with email + password.
 */
export const members = pgTable(
  "members",
  {
    id: serial("id").primaryKey(),
    memberNumber: text("member_number").notNull().unique(), // GS-M-1001
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    tier: text("tier").notNull(), // key of TIERS in config/site.ts
    billing: text("billing").notNull().default("annual"), // annual | lifetime
    status: text("status").notNull().default("pending"), // pending | active | suspended | expired
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    renewsAt: timestamp("renews_at", { withTimezone: true }), // null for lifetime
    passwordHash: text("password_hash"),
    activationCode: text("activation_code"),
    lockerNumber: text("locker_number"),
    guestPassesRemaining: integer("guest_passes_remaining").notNull().default(0),
    stripeCustomerId: text("stripe_customer_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("members_email_idx").on(t.email)],
);

/** Member-only service requests handled by staff (lockers, guest passes, storage…). */
export const memberRequests = pgTable(
  "member_requests",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    kind: text("kind").notNull(), // locker | guest_pass | storage | ammo | gunsmith | general
    details: text("details").notNull().default(""),
    status: text("status").notNull().default("requested"), // requested | approved | declined | fulfilled | cancelled
    staffNotes: text("staff_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("member_requests_member_idx").on(t.memberId)],
);

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    experienceId: integer("experience_id")
      .notNull()
      .references(() => experiences.id),
    resource: text("resource").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    guests: integer("guests").notNull(),
    units: integer("units").notNull(),
    amountCents: integer("amount_cents").notNull(),
    status: text("status").notNull(), // pending | confirmed | cancelled
    paymentStatus: text("payment_status").notNull(), // unpaid | paid | pay_on_arrival | refunded
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    memberNumber: text("member_number"),
    memberId: integer("member_id"),
    notes: text("notes"),
    ackRequirements: boolean("ack_requirements").notNull().default(false),
    /** When the day-before reminder went out (null until the daily cron mails it). */
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("bookings_resource_starts_idx").on(t.resource, t.startsAt), index("bookings_email_idx").on(t.email)],
);

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(), // event | membership | general
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  guests: integer("guests"),
  preferredDate: text("preferred_date"),
  message: text("message").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * From the desk: dated one-liners written by whoever is on, shown above the
 * footer on / and /visit. Text is capped at 90 characters in the action.
 */
export const deskLog = pgTable(
  "desk_log",
  {
    id: serial("id").primaryKey(),
    date: text("date").notNull(), // YYYY-MM-DD in the club's timezone
    text: text("text").notNull(),
    initials: text("initials").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("desk_log_date_idx").on(t.date)],
);

export type DeskLogEntry = typeof deskLog.$inferSelect;
export type Experience = typeof experiences.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Inquiry = typeof inquiries.$inferSelect;
export type Member = typeof members.$inferSelect;
export type MemberRequest = typeof memberRequests.$inferSelect;
