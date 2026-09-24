import { afterEach, describe, expect, it } from "vitest";

process.env.PGLITE_DATA_DIR = "memory://";
delete process.env.DATABASE_URL;
delete process.env.RESEND_API_KEY;
delete process.env.CRON_SECRET;

import { GET as run } from "@/app/api/cron/run/route";
import { GET as reminders } from "@/app/api/cron/reminders/route";
import { GET as classMail } from "@/app/api/cron/class-mail/route";

type Handler = (req: Request) => Promise<Response>;

function call(handler: Handler, token?: string) {
  return handler(new Request("https://gunspa.com/api/cron/run", { headers: token ? { authorization: `Bearer ${token}` } : {} }));
}

describe("scheduled run (GET /api/cron/run)", () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
    delete process.env.RESEND_API_KEY;
  });

  it("refuses every caller without CRON_SECRET, and any caller with the wrong token", async () => {
    expect((await call(run, "anything")).status).toBe(401);
    process.env.CRON_SECRET = "s3cret";
    expect((await call(run)).status).toBe(401);
    expect((await call(run, "s3cre")).status).toBe(401);
    expect((await call(run, "s3cret!")).status).toBe(401);
    expect(await (await call(run, "wrong")).json()).toEqual({ error: "Unauthorized" });
  });

  it("purges, drains class mail and runs reminders in one summary; 503 until email is configured", async () => {
    process.env.CRON_SECRET = "s3cret";
    const res = await call(run, "s3cret");
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Email is not configured");
    expect(body.documents).toEqual({ purged: true });
    expect(body.classMail.reconciled).toEqual({ scanned: 0, enqueued: 0, failed: 0 });
    expect(body.classMail.delivery).toEqual({ claimed: 0, sent: 0, failed: 0, skipped: 0 });
    expect(body.reminders).toBeNull();

    process.env.RESEND_API_KEY = "re_test_only";
    const ok = await call(run, "s3cret");
    expect(ok.status).toBe(200);
    const summary = await ok.json();
    expect(summary.ok).toBe(true);
    expect(summary.error).toBeUndefined();
    expect(summary.reminders).toMatchObject({ due: 0, sent: [], failed: [], skipped: [] });
    expect(summary.reminders.window).toMatch(/^\d{4}-.*Z\/\d{4}-.*Z$/);
    expect(typeof summary.ranAt).toBe("string");
  });

  it("keeps /api/cron/reminders and /api/cron/class-mail as aliases of the same run", async () => {
    process.env.CRON_SECRET = "s3cret";
    expect((await call(reminders)).status).toBe(401);
    expect((await call(classMail, "nope")).status).toBe(401);
    process.env.RESEND_API_KEY = "re_test_only";
    for (const handler of [reminders, classMail]) {
      const res = await call(handler, "s3cret");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Object.keys(body).sort()).toEqual(["classMail", "documents", "ok", "ranAt", "reminders"]);
    }
  });
});
