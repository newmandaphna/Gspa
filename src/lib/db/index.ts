import { mkdirSync } from "node:fs";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { ensureSchema } from "./migrate";
import { seedCatalog } from "./seed";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * Driver selection:
 *  - DATABASE_URL set  → node-postgres (Replit PostgreSQL / Neon / any Postgres)
 *  - otherwise         → PGlite, an embedded Postgres stored in ./.data/pglite
 *
 * The promise is cached on globalThis so Next.js dev HMR does not open a
 * second PGlite handle on the same directory.
 */
const g = globalThis as unknown as { __gunspaDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!g.__gunspaDb) {
    g.__gunspaDb = init().catch((err) => {
      g.__gunspaDb = undefined;
      throw err;
    });
  }
  return g.__gunspaDb;
}

function wantsSsl(url: string): boolean {
  if (/sslmode=(disable|allow)/i.test(url)) return false;
  if (/sslmode=(require|prefer|verify-ca|verify-full)/i.test(url)) return true;
  return !/@(localhost|127\.0\.0\.1|0\.0\.0\.0)[:/]/i.test(url);
}

async function init(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  // A published Replit deployment (Autoscale) has an ephemeral, per-instance filesystem: PGlite there
  // would silently split and then lose every reservation. Refuse to start unless explicitly allowed.
  if (!url && process.env.REPLIT_DEPLOYMENT && process.env.ALLOW_PGLITE !== "1") {
    throw new Error("DATABASE_URL is required in a Replit deployment: create a PostgreSQL database under Database, or set ALLOW_PGLITE=1 to accept an ephemeral per-instance store.");
  }
  let db: Db;
  if (url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new Pool({
      connectionString: url,
      max: 5,
      ssl: wantsSsl(url) ? { rejectUnauthorized: false } : undefined,
    });
    db = drizzle(pool, { schema }) as unknown as Db;
    console.info("[db] connected via node-postgres");
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const dir = process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), ".data", "pglite");
    // "memory://" gives an ephemeral in-memory database (used by tests).
    // PGlite does not create parent directories, so make sure ./.data exists on a fresh clone.
    if (dir !== "memory://") mkdirSync(dir, { recursive: true });
    const client = dir === "memory://" ? new PGlite() : new PGlite(dir);
    await client.waitReady;
    db = drizzle(client, { schema }) as unknown as Db;
    if (process.env.NODE_ENV !== "test") {
      console.info(`[db] using embedded PGlite at ${dir} (set DATABASE_URL for production)`);
    }
  }
  await ensureSchema(db);
  await seedCatalog(db);
  return db;
}

export { schema };
