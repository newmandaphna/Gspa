import { beforeEach, describe, expect, it, vi } from "vitest";
process.env.PGLITE_DATA_DIR = "memory://";
delete process.env.DATABASE_URL;
const proxy = vi.hoisted(() => vi.fn());
const afterCallbacks = vi.hoisted(() => [] as Array<() => Promise<void>>);
vi.mock("@replit/connectors-sdk", () => ({ ReplitConnectors: class { proxy = proxy; } }));
vi.mock("next/server", async importOriginal => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (callback: () => Promise<void>) => { afterCallbacks.push(callback); },
}));
import { sendSignupToSheet, signupHeaders, signupRow, syncSignup } from "@/lib/signup-sheet";
import { POST as submitInquiry } from "@/app/api/inquiries/route";
import { getDb } from "@/lib/db";
import { inquiries, type Inquiry } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const inquiry: Inquiry = {
  id: 123, kind: "membership", name: "=not-a-formula", email: "test@example.invalid",
  phone: "0123456789", company: null, guests: null, preferredDate: null,
  message: "Membership list (pre-opening)\nZIP: 01234\nNYC pistol license: Pending\nHeard via: Search",
  interest: "Both", duplicateEmail: true, sheetStatus: "pending", sheetAttempts: 0,
  sheetRetryAt: new Date(), sheetError: null, sheetSyncedAt: null,
  createdAt: new Date("2026-09-28T12:00:00Z"),
};
const ok = (values?: string[][]) => ({ ok: true, json: async () => ({ values }) });
describe("signup spreadsheet", () => {
  beforeEach(() => { proxy.mockReset(); afterCallbacks.length = 0; });
  it("preserves literal text, leading zeros, interest, default follow-up and duplicate flag", () => {
    expect(signupRow(inquiry)).toEqual([
      "123", "2026-09-28T12:00:00.000Z", "=not-a-formula", "test@example.invalid",
      "0123456789", "01234", "Pending", "Search", "Both", "New", "", "", "", "", "Yes",
    ]);
  });
  it("reads IDs then appends once using RAW", async () => {
    proxy.mockResolvedValueOnce(ok([signupHeaders])).mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok());
    await sendSignupToSheet(inquiry);
    expect(proxy).toHaveBeenCalledTimes(3);
    expect(proxy.mock.calls[2][1]).toContain("valueInputOption=RAW");
    expect(proxy.mock.calls[2][2]).toMatchObject({ method: "POST" });
  });
  it("reconciles an ambiguous append without duplicating or overwriting staff notes", async () => {
    const existing = signupRow(inquiry);
    existing[9] = "Contacted"; existing[13] = "Desk note";
    proxy.mockResolvedValueOnce(ok([signupHeaders])).mockResolvedValueOnce(ok([existing]));
    await sendSignupToSheet(inquiry);
    expect(proxy).toHaveBeenCalledTimes(2);
  });
  it("only fills missing follow-up and interest cells on old rows", async () => {
    proxy.mockResolvedValueOnce(ok([signupHeaders])).mockResolvedValueOnce(ok([["123"]]))
      .mockResolvedValue(ok());
    await sendSignupToSheet(inquiry);
    const writes = proxy.mock.calls.filter(call => call[2]?.method === "PUT");
    expect(writes).toHaveLength(3);
    expect(writes.every(call => !call[1].includes("K2") && !call[1].includes("N2"))).toBe(true);
  });
  it("does not send other inquiries", async () => {
    await sendSignupToSheet({ ...inquiry, kind: "event" });
    expect(proxy).not.toHaveBeenCalled();
  });
  it("does not append when the sheet cannot be read", async () => {
    proxy.mockResolvedValueOnce({ ok: false, status: 403 });
    await expect(sendSignupToSheet(inquiry)).rejects.toThrow("403");
    expect(proxy).toHaveBeenCalledTimes(1);
  });
  it("persists retry status and reconciles an ambiguous remote append on the next attempt", async () => {
    const db = await getDb();
    const [row] = await db.insert(inquiries).values({
      kind: "membership", name: inquiry.name, email: inquiry.email,
      message: inquiry.message, interest: inquiry.interest,
    }).returning();
    // A timed-out append may actually have succeeded on Google's side.
    proxy.mockResolvedValueOnce(ok([signupHeaders])).mockResolvedValueOnce(ok([]))
      .mockRejectedValueOnce(new Error("timeout"));
    expect(await syncSignup(row.id)).toBe("failed");
    const [failed] = await db.select().from(inquiries).where(eq(inquiries.id, row.id));
    expect(failed).toMatchObject({ sheetStatus: "retry", sheetAttempts: 1, sheetError: "timeout" });
    expect(failed.sheetRetryAt.getTime()).toBeGreaterThan(Date.now());

    proxy.mockReset();
    proxy.mockResolvedValueOnce(ok([signupHeaders]))
      .mockResolvedValueOnce(ok([[String(row.id), "", "", "", "", "", "", "", "Both", "Contacted", "", "", "", "Staff note", "No"]]));
    expect(await syncSignup(row.id, true)).toBe("synced");
    expect(proxy.mock.calls.filter(call => call[2]?.method === "POST")).toHaveLength(0);
    const [synced] = await db.select().from(inquiries).where(eq(inquiries.id, row.id));
    expect(synced).toMatchObject({ sheetStatus: "synced", sheetAttempts: 2, sheetError: null });
  });
  it("saves before returning and schedules current delivery plus a small due sweep after response", async () => {
    const db = await getDb();
    const [older] = await db.insert(inquiries).values({
      kind: "membership", name: "Earlier lead", email: "earlier@example.invalid",
      message: inquiry.message, sheetStatus: "retry", sheetRetryAt: new Date(0),
    }).returning();
    const res = await submitInquiry(new Request("https://gunspa.com/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "192.0.2.123" },
      body: JSON.stringify({
        kind: "membership", name: "Later lead", email: "later@example.invalid",
        message: inquiry.message, interest: "Training",
      }),
    }));
    expect(res.status).toBe(200);
    const { id } = await res.json() as { id: number };
    expect(afterCallbacks).toHaveLength(1);
    expect((await db.select().from(inquiries).where(eq(inquiries.id, id)))[0].sheetStatus).toBe("pending");
    expect(proxy).not.toHaveBeenCalled();

    const sheetRows: string[][] = [];
    proxy.mockImplementation(async (_connector: string, url: string, options?: { method: string; body: string }) => {
      if (!options) return ok(decodeURIComponent(url).includes("A1:O1") ? [signupHeaders] : sheetRows);
      if (options.method === "POST") sheetRows.push((JSON.parse(options.body) as { values: string[][] }).values[0]);
      return ok();
    });
    await afterCallbacks[0]();
    expect(sheetRows.map(row => row[0]).sort()).toEqual([String(older.id), String(id)].sort());
    expect((await db.select().from(inquiries).where(eq(inquiries.id, id)))[0].sheetStatus).toBe("synced");
    expect((await db.select().from(inquiries).where(eq(inquiries.id, older.id)))[0].sheetStatus).toBe("synced");
  });
});