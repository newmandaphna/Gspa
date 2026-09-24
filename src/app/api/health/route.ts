import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Deployment health check: verifies the database answers. */
export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: process.env.DATABASE_URL ? "postgres" : "pglite" });
  } catch (err) {
    console.error("[health]", err);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
