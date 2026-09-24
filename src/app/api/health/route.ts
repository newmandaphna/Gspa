import { NextResponse } from "next/server";
import { SITE } from "@/lib/config/site";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Deployment health check: verifies the database answers and reports the origin the server resolved. */
export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: process.env.DATABASE_URL ? "postgres" : "pglite", site: SITE.url });
  } catch (err) {
    console.error("[health]", err);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
