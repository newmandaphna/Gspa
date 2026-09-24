import { beforeAll, describe, expect, it } from "vitest";

process.env.PGLITE_DATA_DIR = "memory://";
delete process.env.DATABASE_URL;

import { getDb } from "@/lib/db";
import { ensureSchema } from "@/lib/db/migrate";
import { addDeskLogEntry, deleteDeskLogEntry, listDeskLog } from "@/lib/desk-log";

const SEED_TEXT = "Site is live. Reservations open.";

describe("desk log (in-memory Postgres)", () => {
  beforeAll(async () => {
    await getDb();
  }, 30_000);

  it("seeds the launch line once, when the table is first created", async () => {
    const seeded = (await listDeskLog(50)).filter((e) => e.text === SEED_TEXT);
    expect(seeded).toHaveLength(1);
    expect(seeded[0].date).toBe("2026-09-24");
    expect(seeded[0].initials).toBe("GS");

    // Another cold start against the same database adds nothing.
    await ensureSchema(await getDb());
    expect((await listDeskLog(50)).filter((e) => e.text === SEED_TEXT)).toHaveLength(1);
  });

  it("keeps a removed line removed across restarts", async () => {
    const [seed] = (await listDeskLog(50)).filter((e) => e.text === SEED_TEXT);
    await deleteDeskLogEntry(seed.id);
    await ensureSchema(await getDb());
    expect((await listDeskLog(50)).some((e) => e.text === SEED_TEXT)).toBe(false);
  });

  it("validates a line before writing it", async () => {
    expect(await addDeskLogEntry({ date: "not a date", text: "x", initials: "gs" })).toEqual({ ok: false, error: "Pick a date." });
    expect(await addDeskLogEntry({ date: "2026-09-25", text: "   ", initials: "gs" })).toEqual({ ok: false, error: "Write the line." });
    expect(await addDeskLogEntry({ date: "2026-09-25", text: "x", initials: "12" })).toEqual({ ok: false, error: "Initials: one to four letters." });
    const long = await addDeskLogEntry({ date: "2026-09-25", text: "a".repeat(91), initials: "gs" });
    expect(long.ok).toBe(false);

    const added = await addDeskLogEntry({ date: "2026-09-25", text: "  Pool   heater back on.  ", initials: " gs " });
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.entry.text).toBe("Pool heater back on.");
    expect(added.entry.initials).toBe("GS");
    expect((await listDeskLog())[0].id).toBe(added.entry.id);
  });
});
