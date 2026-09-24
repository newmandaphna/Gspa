import { index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { EmailMessage } from "@/lib/email";
import { sql } from "drizzle-orm";
import type { Db } from "./index";

/**
 * Durable delivery queue for scheduled-class mail. Deliberately has no
 * Drizzle foreign key: schema.ts owns bookings and importing it here would
 * make the mail/schema dependency circular.
 */
export const classMailOutbox = pgTable(
  "class_mail_outbox",
  {
    id: serial("id").primaryKey(),
    bookingId: integer("booking_id").notNull(),
    eventKey: text("event_key").notNull(),
    kind: text("kind").notNull(),
    recipient: text("recipient").notNull(),
    message: jsonb("message").$type<EmailMessage>().notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("class_mail_outbox_event_key_idx").on(t.eventKey),
    index("class_mail_outbox_pending_idx").on(t.status, t.availableAt),
  ],
);

export type ClassMailOutboxRow = typeof classMailOutbox.$inferSelect;

/** Local PGlite/test provisioning only; managed PostgreSQL uses Publish schema sync. */
export async function ensureClassMailSchema(db: Db): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS class_mail_outbox (
      id serial PRIMARY KEY,
      booking_id integer NOT NULL,
      event_key text NOT NULL,
      kind text NOT NULL,
      recipient text NOT NULL,
      message jsonb NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      attempts integer NOT NULL DEFAULT 0,
      available_at timestamptz NOT NULL DEFAULT now(),
      lease_until timestamptz,
      last_error text,
      created_at timestamptz NOT NULL DEFAULT now(),
      sent_at timestamptz
    )
  `);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS class_mail_outbox_event_key_idx ON class_mail_outbox (event_key)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS class_mail_outbox_pending_idx ON class_mail_outbox (status, available_at)`);
}