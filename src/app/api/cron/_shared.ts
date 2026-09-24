import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { ClassMailQueueResult, ClassMailReconcileResult } from "@/lib/class-mail";
import type { ReminderRunResult } from "@/lib/reminders";

/**
 * The one scheduled run. A Replit Scheduled Deployment calls GET
 * /api/cron/run once an hour:
 *
 *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://gunspa.com/api/cron/run
 *
 * The secret is compared in constant time. Without CRON_SECRET set the route
 * refuses every call with the same 401 an unauthorized caller gets (the
 * missing secret is logged, not disclosed), so a deployment cannot be nudged
 * into mailing guests by accident.
 *
 * In order: expired class ID documents are purged, the class mail outbox is
 * reconciled and drained, and the day-before reminders go out. Without
 * RESEND_API_KEY the run answers 503; the outbox rows are left pending with
 * their retry note and no reminder is stamped, so everything stays due for a
 * run that can reach the guests. Safe to call more than once an hour, or
 * twice at once: outbox rows carry leases and each booking is claimed before
 * its email goes out.
 */
export type ScheduledRunSummary = {
  ok: boolean;
  ranAt: string;
  documents: { purged: boolean; error?: string };
  classMail: { reconciled: ClassMailReconcileResult; delivery: ClassMailQueueResult } | { error: string };
  /** Null when email is not configured: nothing was sent and nothing was stamped. */
  reminders: ReminderRunResult | null;
  error?: string;
};

/** Returns the 401 to send, or null when the bearer token matches CRON_SECRET. */
export function unauthorizedCron(req: Request): NextResponse | null {
  const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET is not set; scheduled run refused");
    return unauthorized();
  }
  const auth = req.headers.get("authorization") ?? "";
  const presented = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!presented || !safeEqual(presented, secret)) return unauthorized();
  return null;
}

/** Purge, class mail, reminders. Each step is isolated so one failure does not hold up the next. */
export async function runScheduledJobs(now: Date = new Date()): Promise<{ summary: ScheduledRunSummary; status: number }> {
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);
  const summary: ScheduledRunSummary = {
    ok: true,
    ranAt: now.toISOString(),
    documents: { purged: false },
    classMail: { error: "Not run" },
    reminders: null,
  };
  const failures: string[] = [];

  try {
    const { purgeExpiredClassDocuments } = await import("@/lib/class-documents");
    await purgeExpiredClassDocuments();
    summary.documents = { purged: true };
  } catch (err) {
    console.error("[cron] class document purge failed", err);
    summary.documents = { purged: false, error: "Class document purge failed" };
    failures.push("documents");
  }

  try {
    const { processClassMailQueue, reconcileClassMailOutbox } = await import("@/lib/class-mail");
    const reconciled = await reconcileClassMailOutbox();
    const delivery = await processClassMailQueue(undefined, { now });
    summary.classMail = { reconciled, delivery };
  } catch (err) {
    console.error("[cron] class mail failed", err);
    summary.classMail = { error: "Class mail run failed" };
    failures.push("classMail");
  }

  if (emailConfigured) {
    try {
      const { runReminders } = await import("@/lib/reminders");
      const result = await runReminders(now);
      summary.reminders = result;
      console.info(`[cron] reminders for ${result.window}: ${result.sent.length} sent, ${result.failed.length} failed`);
    } catch (err) {
      console.error("[cron] reminders failed", err);
      failures.push("reminders");
    }
  } else {
    console.error("[cron] RESEND_API_KEY is not set; reminders not sent");
  }

  if (failures.length > 0) {
    summary.ok = false;
    summary.error = `Failed: ${failures.join(", ")}`;
    return { summary, status: 500 };
  }
  if (!emailConfigured) {
    summary.ok = false;
    summary.error = "Email is not configured";
    return { summary, status: 503 };
  }
  return { summary, status: 200 };
}

/** The whole route: bearer check, then the scheduled jobs, as one JSON summary. */
export async function handleCronRequest(req: Request): Promise<NextResponse> {
  const refused = unauthorizedCron(req);
  if (refused) return refused;
  const { summary, status } = await runScheduledJobs(new Date());
  return NextResponse.json(summary, { status });
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
