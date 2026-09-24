import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processClassMailQueue, reconcileClassMailOutbox } from "@/lib/class-mail";

export const dynamic = "force-dynamic";

/** Run every few minutes; reconciliation repairs a booking commit whose enqueue failed. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const presented = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || !presented || !safeEqual(presented, secret)) {
    if (!secret) console.error("[cron] CRON_SECRET is not set; class mail refused");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { purgeExpiredClassDocuments } = await import("@/lib/class-documents");
    await purgeExpiredClassDocuments();
  } catch (err) {
    console.error("[cron] class document purge failed", err);
  }

  try {
    const reconciled = await reconcileClassMailOutbox();
    const delivery = await processClassMailQueue();
    const configured = Boolean(process.env.RESEND_API_KEY);
    return NextResponse.json(
      { ok: configured, reconciled, delivery, ...(configured ? {} : { error: "Email is not configured" }) },
      { status: configured ? 200 : 503 },
    );
  } catch (err) {
    console.error("[cron] class mail failed", err);
    return NextResponse.json({ ok: false, error: "Class mail run failed" }, { status: 500 });
  }
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}