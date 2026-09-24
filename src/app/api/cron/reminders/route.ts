import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";

/**
 * Day-before reminders. A Replit Scheduled Deployment calls this once a day
 * at 10:00 America/New_York:
 *
 *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://gunspa.com/api/cron/reminders
 *
 * The secret is compared in constant time. Without CRON_SECRET set the route
 * refuses every call with the same 401 an unauthorized caller gets (the
 * missing secret is logged, not disclosed), so a deployment cannot be nudged
 * into mailing guests by accident. Without RESEND_API_KEY it answers 503 and
 * stamps nothing, so the guests stay due for a run that can reach them.
 * Safe to call more than once a day, or twice at once: each booking is
 * claimed before its email goes out.
 */
export async function GET(req: Request) {
  const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET is not set; reminders refused");
    return unauthorized();
  }
  const auth = req.headers.get("authorization") ?? "";
  const presented = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!presented || !safeEqual(presented, secret)) return unauthorized();
  if (!process.env.RESEND_API_KEY) {
    console.error("[cron] RESEND_API_KEY is not set; reminders not sent");
    return NextResponse.json({ ok: false, error: "Email is not configured" }, { status: 503 });
  }

  try {
    const result = await runReminders(new Date());
    console.info(`[cron] reminders for ${result.window}: ${result.sent.length} sent, ${result.failed.length} failed`);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] reminders failed", err);
    return NextResponse.json({ ok: false, error: "Reminder run failed" }, { status: 500 });
  }
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
