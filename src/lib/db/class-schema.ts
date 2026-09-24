import { sql } from "drizzle-orm";
import type { Db } from "./index";

/** Explicit local/test helper. Production class DDL is applied out of band. */
export async function ensureClassSchema(db: Db): Promise<void> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS class_sessions (
    id SERIAL PRIMARY KEY, experience_id INTEGER NOT NULL REFERENCES experiences(id),
    title TEXT NOT NULL, starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 200),
    max_per_booking INTEGER NOT NULL CHECK (max_per_booking BETWEEN 1 AND 20),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed','cancelled')),
    instructor TEXT, requirements TEXT NOT NULL DEFAULT '', staff_notes TEXT,
    collect_id BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ends_at > starts_at)
  )`);
  await db.execute(sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS class_session_id INTEGER REFERENCES class_sessions(id)`);
  await db.execute(sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS mailing_address JSONB`);
  await db.execute(sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS attendees JSONB`);
  await db.execute(sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS class_details JSONB`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS bookings_class_session_idx ON bookings(class_session_id)`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS class_documents (
    id SERIAL PRIMARY KEY, booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    attendee_index INTEGER NOT NULL CHECK (attendee_index >= 0),
    ciphertext TEXT NOT NULL, iv TEXT NOT NULL, auth_tag TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(booking_id, attendee_index)
  )`);
}