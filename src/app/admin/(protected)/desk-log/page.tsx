import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { DESK_LOG_MAX_CHARS, DESK_LOG_SHOWN, formatDeskDate, listDeskLog } from "@/lib/desk-log";
import { todayIso } from "@/lib/time";
import { DeskLogForm } from "@/components/admin/DeskLogForm";
import { deleteDeskLogAction } from "./actions";

export const metadata: Metadata = { title: "Front desk · Desk log", robots: { index: false } };

export default async function AdminDeskLog({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { saved } = await searchParams;
  const rows = await listDeskLog(100);
  return (
    <div>
      <h1 className="t-2">Desk log</h1>
      <p className="t-body mt-1 max-w-[40em] text-ink-muted">
        One dated line from whoever is on. The newest {DESK_LOG_SHOWN} show under &ldquo;From the desk&rdquo; on the home page and the visit page. {DESK_LOG_MAX_CHARS} characters, one fact, your
        initials.
      </p>

      <div className="mt-6 rounded-card-sm bg-white p-4 ring-1 ring-ink/8 sm:p-5">
        <DeskLogForm today={todayIso()} max={DESK_LOG_MAX_CHARS} saved={saved === "1"} />
      </div>

      {rows.length === 0 ? (
        <p className="t-body mt-6 text-ink-muted">Nothing in the log yet.</p>
      ) : (
        <ol className="mt-6 divide-y divide-ink/10 rounded-card-sm bg-white ring-1 ring-ink/8">
          {rows.map((e, i) => (
            <li key={e.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 font-mono text-[0.875rem]">
                <time dateTime={e.date} className="tabular text-ink-muted">
                  {formatDeskDate(e.date)}
                </time>
                <span className="mx-3 text-ink-faint">·</span>
                <span className="text-ink">{e.text}</span>
                <span className="mx-3 text-ink-faint">·</span>
                <span className="text-ink-muted">{e.initials}</span>
                {i < DESK_LOG_SHOWN && <span className="t-footnote ml-3 rounded-pill bg-accent/25 px-2 py-0.5 font-semibold text-accent-deep">on the site</span>}
              </p>
              <form action={deleteDeskLogAction}>
                <input type="hidden" name="id" value={e.id} />
                <button type="submit" className="t-caption text-ink-muted underline underline-offset-2 hover:text-danger">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
