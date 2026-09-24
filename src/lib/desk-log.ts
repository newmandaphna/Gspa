import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { ensureSchema } from "@/lib/db/migrate";
import { deskLog, type DeskLogEntry } from "@/lib/db/schema";
import { isIsoDate } from "@/lib/time";

/** Hard cap on a line. One sentence, one fact; the strip shows five at most. */
export const DESK_LOG_MAX_CHARS = 90;
export const DESK_LOG_SHOWN = 5;

export type DeskLogResult = { ok: true; entry: DeskLogEntry } | { ok: false; error: string };

/** Newest first. */
export async function listDeskLog(limit = DESK_LOG_SHOWN): Promise<DeskLogEntry[]> {
  const db = await getDb();
  const query = () => db.select().from(deskLog).orderBy(desc(deskLog.date), desc(deskLog.id)).limit(limit);
  try {
    return await query();
  } catch (err) {
    // A server that was already up when this table arrived (dev HMR keeps the connection) has not run the migration yet.
    if (!/desk_log/.test(String(err))) throw err;
    await ensureSchema(db);
    return query();
  }
}

export async function addDeskLogEntry(input: { date: string; text: string; initials: string }): Promise<DeskLogResult> {
  const date = input.date.trim();
  const text = input.text.trim().replace(/\s+/g, " ");
  const initials = input.initials.trim().toUpperCase();
  if (!isIsoDate(date)) return { ok: false, error: "Pick a date." };
  if (!text) return { ok: false, error: "Write the line." };
  if (text.length > DESK_LOG_MAX_CHARS) return { ok: false, error: `Keep it under ${DESK_LOG_MAX_CHARS} characters (${text.length} now).` };
  if (!/^[A-Z]{1,4}$/.test(initials)) return { ok: false, error: "Initials: one to four letters." };
  const db = await getDb();
  const [entry] = await db.insert(deskLog).values({ date, text, initials }).returning();
  return { ok: true, entry };
}

export async function deleteDeskLogEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.delete(deskLog).where(eq(deskLog.id, id));
}

/** "Sep 24, 2026" from "2026-09-24", timezone-independent. */
export function formatDeskDate(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}
