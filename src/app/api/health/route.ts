import { NextResponse } from "next/server";
import { SITE } from "@/lib/config/site";
import { scheduleOpportunisticClassMailDrain } from "@/lib/class-mail";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Deployment health check: verifies the database answers and reports the
 * origin the server resolved. On the side, once the response is out, it
 * retries up to five pending class mail rows (at most once a minute per
 * process) so a refused send does not wait for the hourly run.
 */
export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    scheduleOpportunisticClassMailDrain();
    return NextResponse.json({ ok: true, db: process.env.DATABASE_URL ? "postgres" : "pglite", site: SITE.url });
  } catch (err) {
    console.error("[health]", err);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
