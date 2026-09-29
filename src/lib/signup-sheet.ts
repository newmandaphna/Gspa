import { ReplitConnectors } from "@replit/connectors-sdk";
import { and, asc, eq, ilike, lt, lte, ne, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { inquiries, type Inquiry } from "@/lib/db/schema";

const spreadsheetId = "1gBSvnilQAc2jJ9h5uYwgVxYSpfVzd5QYi8jl5a749wg";
const sheet = "'Sheet1'!";
export const signupHeaders = [
  "Signup ID", "Signed up (UTC)", "Full name", "Email", "Phone", "ZIP code",
  "NYC pistol license", "Heard via", "Interest", "Status", "Assigned to",
  "Last contacted", "Next follow-up", "Notes", "Duplicate email",
];

export function isSignup(inquiry: Inquiry): boolean {
  return inquiry.kind === "membership" && inquiry.message.startsWith("Membership list (pre-opening)");
}

export function signupRow(inquiry: Inquiry): string[] {
  const field = (name: string) => inquiry.message.split("\n").find(line => line.startsWith(`${name}: `))?.slice(name.length + 2) ?? "";
  return [String(inquiry.id), inquiry.createdAt.toISOString(), inquiry.name, inquiry.email,
    inquiry.phone ?? "", field("ZIP"), field("NYC pistol license"), field("Heard via"),
    inquiry.interest ?? "", "New", "", "", "", "", inquiry.duplicateEmail ? "Yes" : "No"];
}

type Sheets = ReplitConnectors;
async function values(client: Sheets, range: string): Promise<string[][]> {
  const response = await client.proxy("google-sheet", `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheet + range)}`);
  if (!response.ok) throw new Error(`Google Sheets read failed (${response.status})`);
  const data = await response.json() as { values?: string[][] };
  return data.values ?? [];
}

async function write(client: Sheets, range: string, rows: string[][]): Promise<void> {
  const response = await client.proxy("google-sheet",
    `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheet + range)}?valueInputOption=RAW`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: rows }),
    });
  if (!response.ok) throw new Error(`Google Sheets write failed (${response.status})`);
}

/**
 * Called only while the DB advisory lock is held. Reads the remote ID before
 * every write (including retries after timeouts); never appends an ID already
 * present. Only fills missing columns on existing rows: staff edits J:N survive.
 */
export async function sendSignupToSheet(inquiry: Inquiry): Promise<void> {
  if (!isSignup(inquiry)) return;
  const client = new ReplitConnectors(); // fresh client/token for each delivery
  const headers = (await values(client, "A1:O1"))[0] ?? [];
  for (let i = 0; i < 8; i++) {
    if (headers[i] !== signupHeaders[i]) throw new Error(`Unexpected Sheet1 column ${i + 1}; sync stopped to protect data`);
  }
  const extra = signupHeaders.slice(8);
  if (extra.some((title, i) => headers[i + 8] && headers[i + 8] !== title)) {
    throw new Error("Sheet1 I:O headers differ; sync stopped to protect staff data");
  }
  if (extra.some((title, i) => headers[i + 8] !== title)) await write(client, "I1:O1", [extra]);

  const rows = await values(client, "A2:O");
  const matches = rows.map((row, i) => row[0] === String(inquiry.id) ? i + 2 : 0).filter(Boolean);
  if (matches.length > 1) throw new Error(`Signup #${inquiry.id} already appears multiple times in Sheet1; resolve manually`);
  if (matches.length === 1) {
    const number = matches[0];
    const row = rows[number - 2];
    if (!row[8]) await write(client, `I${number}`, [[inquiry.interest ?? ""]]);
    if (!row[9]) await write(client, `J${number}`, [["New"]]);
    const duplicate = inquiry.duplicateEmail ? "Yes" : "No";
    if (row[14] !== duplicate) await write(client, `O${number}`, [[duplicate]]);
    return;
  }
  const response = await client.proxy("google-sheet",
    `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheet + "A:O")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values: [signupRow(inquiry)] }),
    });
  if (!response.ok) throw new Error(`Google Sheets append failed (${response.status})`);
}

export type SignupSyncResult = "synced" | "failed" | "skipped";

/** Try-lock avoids tying up serverless workers during another delivery. A skipped row stays due. */
export async function syncSignup(id: number, force = false, now = new Date()): Promise<SignupSyncResult> {
  const db = await getDb();
  return db.transaction(async tx => {
    const lock = await tx.execute(sql`SELECT pg_try_advisory_xact_lock(7264092) AS acquired`) as unknown as { rows: Array<{ acquired: boolean }> };
    if (lock.rows[0]?.acquired !== true) return "skipped";
    let [row] = await tx.select().from(inquiries).where(eq(inquiries.id, id));
    if (!row || !isSignup(row) || row.sheetStatus === "synced" || (!force && row.sheetRetryAt > now)) return "skipped";
    try {
      // Additive migration defaults old rows to false; derive their flag before backfilling.
      const prior = await tx.select({ id: inquiries.id }).from(inquiries).where(and(
        lt(inquiries.id, id), eq(inquiries.kind, "membership"), eq(inquiries.email, row.email),
        ilike(inquiries.message, "Membership list (pre-opening)%"),
      )).limit(1);
      if (row.duplicateEmail !== (prior.length > 0)) {
        row = { ...row, duplicateEmail: prior.length > 0 };
        await tx.update(inquiries).set({ duplicateEmail: row.duplicateEmail }).where(eq(inquiries.id, id));
      }
      await sendSignupToSheet(row);
      await tx.update(inquiries).set({ sheetStatus: "synced", sheetError: null, sheetSyncedAt: now, sheetAttempts: row.sheetAttempts + 1 }).where(eq(inquiries.id, id));
      return "synced";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const attempts = row.sheetAttempts + 1;
      const delay = Math.min(24 * 60, 2 ** Math.min(attempts, 10)) * 60_000;
      await tx.update(inquiries).set({
        sheetStatus: "retry", sheetAttempts: attempts, sheetRetryAt: new Date(now.getTime() + delay),
        sheetError: message.slice(0, 500),
      }).where(eq(inquiries.id, id));
      console.error(`[signup-sheet] #${id} sync failed: ${message}`);
      return "failed";
    }
  });
}

/** Safe to call from both an authenticated cron and the admin page. */
export async function processSignupSheetQueue(now = new Date(), limit = 30) {
  const db = await getDb();
  const due = await db.select({ id: inquiries.id }).from(inquiries).where(and(
    eq(inquiries.kind, "membership"), ilike(inquiries.message, "Membership list (pre-opening)%"),
    ne(inquiries.sheetStatus, "synced"), lte(inquiries.sheetRetryAt, now),
  )).orderBy(asc(inquiries.sheetRetryAt)).limit(limit);
  const result = { due: due.length, synced: 0, failed: 0, skipped: 0 };
  for (const row of due) {
    const outcome = await syncSignup(row.id, false, now);
    result[outcome]++;
  }
  return result;
}