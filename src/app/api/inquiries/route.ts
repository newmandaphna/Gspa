import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { inquiries } from "@/lib/db/schema";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { firstIssue, inquiryInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(`inquiry:${clientKey(req)}`, { limit: 5, windowMs: 10 * 60_000 })) {
    return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = inquiryInputSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  const d = parsed.data;
  try {
    const db = await getDb();
    const [row] = await db
      .insert(inquiries)
      .values({
        kind: d.kind,
        name: d.name,
        email: d.email.toLowerCase(),
        phone: d.phone || null,
        company: d.company || null,
        guests: d.guests ?? null,
        preferredDate: d.preferredDate || null,
        message: d.message || "",
      })
      .returning({ id: inquiries.id });
    console.info(`[inquiry] #${row.id} ${d.kind} from ${d.email}`);
    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    console.error("[inquiry] failed", err);
    return NextResponse.json({ error: "Could not send your message. Please email us directly." }, { status: 500 });
  }
}
