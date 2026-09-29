import { NextResponse } from "next/server";
import { after } from "next/server";
import { getDb } from "@/lib/db";
import { inquiries } from "@/lib/db/schema";
import { expectedJson, isJsonRequest } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { firstIssue, inquiryInputSchema } from "@/lib/validation";
import { formatSignupPhone, SIGNUP_PREFIX } from "@/lib/signup-validation";
import { isSignup, processSignupSheetQueue, syncSignup } from "@/lib/signup-sheet";
import { and, eq, ilike, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(`inquiry:${clientKey(req)}`, { limit: 5, windowMs: 10 * 60_000 })) {
    return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  }
  if (!isJsonRequest(req)) return expectedJson();
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = inquiryInputSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  const d = parsed.data;
  const signup = d.kind === "membership" && (d.message ?? "").startsWith(SIGNUP_PREFIX);
  try {
    const db = await getDb();
    const row = await db.transaction(async (tx) => {
       if (signup) {
        // Serialize signups for the same email even on different serverless instances.
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${d.email.toLowerCase()}))`);
      }
       const previous = signup
        ? await tx.select({ id: inquiries.id }).from(inquiries).where(and(
          eq(inquiries.kind, "membership"), eq(inquiries.email, d.email.toLowerCase()),
          ilike(inquiries.message, "Membership list (pre-opening)%"),
        )).limit(1) : [];
      const [inserted] = await tx.insert(inquiries).values({
        kind: d.kind,
        name: d.name,
        email: d.email.toLowerCase(),
         phone: signup ? formatSignupPhone(d.phone ?? "") || null : d.phone || null,
        company: d.company || null,
        guests: d.guests ?? null,
        preferredDate: d.preferredDate || null,
        message: d.message || "",
        interest: d.kind === "membership" ? d.interest ?? null : null,
        duplicateEmail: previous.length > 0,
         sheetStatus: signup ? "pending" : "not_applicable",
      }).returning();
      return inserted;
    });
    if (isSignup(row)) {
      // Return the durable DB receipt immediately; Next keeps this work attached
      // to the request lifecycle after the response is sent. Future signups also
      // drain a few previously due retries when no cron scheduler is configured.
      after(async () => {
        try {
          await syncSignup(row.id);
        } catch (error) {
          console.error(`[inquiry] #${row.id} saved; spreadsheet sync deferred`, error);
        }
        try {
          await processSignupSheetQueue(new Date(), 3);
        } catch (error) {
          console.error("[inquiry] deferred signup retry sweep failed", error);
        }
      });
    }
    console.info(`[inquiry] #${row.id} ${d.kind} saved`);
    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    console.error("[inquiry] failed", err);
    return NextResponse.json({ error: "Could not send your message. Please email us directly." }, { status: 500 });
  }
}
