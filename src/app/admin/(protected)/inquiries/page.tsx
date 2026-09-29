import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { listInquiries } from "@/lib/inquiries";
import { formatInstant } from "@/lib/time";
import { isSignup } from "@/lib/signup-sheet";
import { retryDueSignupsAction, retrySignupAction } from "./actions";

export const metadata: Metadata = { title: "Front desk · Inquiries", robots: { index: false } };

export default async function AdminInquiries() {
  await requireAdmin();
  const rows = await listInquiries(200);
  return (
    <div>
      <h1 className="t-2">Inquiries</h1>
      <p className="t-body mt-1 text-ink-muted">Event, membership and general inquiries from the website.</p>
      <p className="t-caption mt-2 text-ink-muted">Signups are saved here first. Delivery runs after the response; later signups retry a few due failures. The scheduled cron run, if configured, also retries them. Without new signups or a scheduler, use the buttons below.</p>
      <form action={retryDueSignupsAction} className="mt-4">
        <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-sm text-white">Retry due sheet deliveries (up to 30)</button>
      </form>
      {rows.length === 0 ? (
        <p className="t-body mt-6 text-ink-muted">No inquiries yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((i) => (
            <li key={i.id} className="rounded-card-sm bg-white p-4 ring-1 ring-ink/8">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="t-body font-medium">
                  {i.name} <span className="t-caption capitalize text-ink-muted">· {i.kind}</span>
                </p>
                <p className="t-footnote text-ink-faint">{formatInstant(i.createdAt)}</p>
              </div>
              <p className="t-caption text-ink-muted">
                <a href={`mailto:${i.email}`} className="underline underline-offset-2">
                  {i.email}
                </a>
                {i.phone ? ` · ${i.phone}` : ""}
                {i.company ? ` · ${i.company}` : ""}
                {i.guests ? ` · ${i.guests} guests` : ""}
                {i.preferredDate ? ` · ${i.preferredDate}` : ""}
              </p>
              {i.message && <p className="t-body mt-2 whitespace-pre-line">{i.message}</p>}
              {isSignup(i) && (
                <div className="mt-3 border-t border-ink/10 pt-3 text-sm text-ink-muted">
                  <p>{i.interest ? `Interest: ${i.interest} · ` : ""}Duplicate email: {i.duplicateEmail ? "Yes" : "No"}</p>
                  <p>Google Sheet: <strong>{i.sheetStatus}</strong>
                    {i.sheetAttempts ? ` · ${i.sheetAttempts} attempt${i.sheetAttempts === 1 ? "" : "s"}` : ""}
                    {i.sheetSyncedAt ? ` · synced ${formatInstant(i.sheetSyncedAt)}` : ""}
                    {i.sheetStatus === "retry" ? ` · next retry ${formatInstant(i.sheetRetryAt)}` : ""}
                  </p>
                  {i.sheetError && <p role="alert" className="break-words text-red-700">{i.sheetError}</p>}
                  {i.sheetStatus !== "synced" && <form action={retrySignupAction} className="mt-2">
                    <input type="hidden" name="id" value={i.id} />
                    <button type="submit" className="rounded-lg border border-ink/20 px-3 py-1.5">Retry this signup now</button>
                  </form>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
