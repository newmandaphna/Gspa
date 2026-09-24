import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { updateRequestAction } from "@/app/admin/actions";
import { adminInput } from "@/app/admin/styles";
import { listMemberRequests, REQUEST_KINDS } from "@/lib/members/service";
import { formatInstant } from "@/lib/time";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Front desk · Requests", robots: { index: false } };

const TONE: Record<string, string> = {
  requested: "bg-accent/25 text-accent-deep",
  approved: "bg-success/15 text-[#1f7a3a]",
  fulfilled: "bg-ink/10 text-ink",
  declined: "bg-ink/10 text-ink-muted",
  cancelled: "bg-ink/5 text-ink-faint",
};

export default async function AdminRequests({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  await requireAdmin();
  const { all } = await searchParams;
  const rows = await listMemberRequests({ openOnly: all !== "1" });
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="t-2">Member requests</h1>
        <Link href={all === "1" ? "/admin/requests" : "/admin/requests?all=1"} className="t-caption underline underline-offset-2">
          {all === "1" ? "Open only" : "Show all"}
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="t-body mt-4 text-ink-muted">Nothing to do.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map(({ request, member }) => (
            <li key={request.id} className="rounded-card-sm bg-white p-4 ring-1 ring-ink/8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="t-body font-medium">
                  <Link href={`/admin/members/${member.id}`} className="underline-offset-2 hover:underline">
                    {member.firstName} {member.lastName}
                  </Link>{" "}
                  <span className="t-caption text-ink-muted">
                    · {member.memberNumber} · {REQUEST_KINDS[request.kind as keyof typeof REQUEST_KINDS] ?? request.kind} · {formatInstant(request.createdAt)}
                  </span>
                </p>
                <span className={cn("t-footnote rounded-pill px-2 py-0.5 font-semibold capitalize", TONE[request.status] ?? TONE.fulfilled)}>{request.status}</span>
              </div>
              <p className="t-body mt-2">{request.details}</p>
              <form action={updateRequestAction} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={request.id} />
                <div className="min-w-[260px] flex-1">
                  <label htmlFor={`notes-${request.id}`} className="t-footnote font-semibold">
                    Note to member
                  </label>
                  <input id={`notes-${request.id}`} name="staffNotes" defaultValue={request.staffNotes ?? ""} placeholder="e.g. Locker 12 assigned, ready Friday" className={adminInput} />
                </div>
                <div>
                  <label htmlFor={`status-${request.id}`} className="t-footnote font-semibold">
                    Status
                  </label>
                  <select id={`status-${request.id}`} name="status" defaultValue={request.status} className={adminInput}>
                    {["requested", "approved", "fulfilled", "declined", "cancelled"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="h-10 rounded-pill bg-ink px-4 text-[0.9375rem] font-medium text-snow">
                  Update
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
