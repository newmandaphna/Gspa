import { sql } from "drizzle-orm";
import type { Db } from "./index";

/**
 * Idempotent schema creation. Runs on first DB access so a fresh Replit
 * (or a fresh laptop) needs zero setup. Mirrors schema.ts exactly.
 *
 * Serialized with a transaction-level advisory lock: several Autoscale
 * instances can cold-start at once against an empty database, and Postgres'
 * CREATE ... IF NOT EXISTS is not race-free (the loser hits a duplicate-key
 * error on pg_type/pg_class). The lock makes the second instance wait until
 * the first has committed, after which every statement is a no-op.
 */
export async function ensureSchema(db: Db): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(7264001)`);
    await createSchema(tx as unknown as Db);
  });
}

async function createSchema(db: Db): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS experiences (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      resource TEXT NOT NULL,
      duration_min INTEGER NOT NULL,
      price_cents INTEGER NOT NULL,
      max_guests_per_unit INTEGER NOT NULL DEFAULT 1,
      max_units_per_booking INTEGER NOT NULL DEFAULT 4,
      tagline TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      includes JSONB NOT NULL DEFAULT '[]'::jsonb,
      bookable BOOLEAN NOT NULL DEFAULT TRUE,
      member_only BOOLEAN NOT NULL DEFAULT FALSE,
      member_price_cents INTEGER,
      min_tier TEXT,
      fixed_units INTEGER,
      extra_guest_cents INTEGER,
      eligibility TEXT NOT NULL DEFAULT 'anyone',
      sort_order INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      experience_id INTEGER NOT NULL REFERENCES experiences(id),
      resource TEXT NOT NULL,
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ NOT NULL,
      guests INTEGER NOT NULL,
      units INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      stripe_session_id TEXT,
      stripe_payment_intent_id TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      member_number TEXT,
      member_id INTEGER,
      notes TEXT,
      ack_requirements BOOLEAN NOT NULL DEFAULT FALSE,
      reminder_sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS bookings_resource_starts_idx ON bookings (resource, starts_at)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS bookings_email_idx ON bookings (email)`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      member_number TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      tier TEXT NOT NULL,
      billing TEXT NOT NULL DEFAULT 'annual',
      status TEXT NOT NULL DEFAULT 'pending',
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      renews_at TIMESTAMPTZ,
      password_hash TEXT,
      activation_code TEXT,
      locker_number TEXT,
      guest_passes_remaining INTEGER NOT NULL DEFAULT 0,
      stripe_customer_id TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS members_email_idx ON members (email)`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS member_requests (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES members(id),
      kind TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'requested',
      staff_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS member_requests_member_idx ON member_requests (member_id)`);
  // Additive migrations for databases created before these columns existed.
  await db.execute(sql`ALTER TABLE experiences ADD COLUMN IF NOT EXISTS member_only BOOLEAN NOT NULL DEFAULT FALSE`);
  await db.execute(sql`ALTER TABLE experiences ADD COLUMN IF NOT EXISTS member_price_cents INTEGER`);
  await db.execute(sql`ALTER TABLE experiences ADD COLUMN IF NOT EXISTS min_tier TEXT`);
  await db.execute(sql`ALTER TABLE experiences ADD COLUMN IF NOT EXISTS fixed_units INTEGER`);
  await db.execute(sql`ALTER TABLE experiences ADD COLUMN IF NOT EXISTS extra_guest_cents INTEGER`);
  await db.execute(sql`ALTER TABLE experiences ADD COLUMN IF NOT EXISTS eligibility TEXT NOT NULL DEFAULT 'anyone'`);
  await db.execute(sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS member_id INTEGER`);
  await db.execute(sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS inquiries (
      id SERIAL PRIMARY KEY,
      kind TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      guests INTEGER,
      preferred_date TEXT,
      message TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Seed the desk log only when this run creates the table. ensureSchema runs on every cold
  // start, and an entry the desk removed must stay removed.
  const deskLogExisted = await tableExists(db, "desk_log");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS desk_log (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      text TEXT NOT NULL,
      initials TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS desk_log_date_idx ON desk_log (date)`);
  if (!deskLogExisted) {
    // The one true entry: the day the site went live. The desk writes everything after it.
    await db.execute(sql`
      INSERT INTO desk_log (date, text, initials)
      VALUES ('2026-09-24', 'Site is live. Reservations open.', 'GS')
    `);
  }
}

/** True when a table of that name is already in the current schema. */
async function tableExists(db: Db, name: string): Promise<boolean> {
  const result = (await db.execute(sql`SELECT to_regclass(${name}) IS NOT NULL AS exists`)) as unknown as {
    rows?: Array<{ exists: boolean | null }>;
  };
  return result.rows?.[0]?.exists === true;
}
