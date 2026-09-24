import type { Metadata } from "next";
import Link from "next/link";
import { CreateMemberForm } from "@/components/admin/AdminForms";
import { tierByKey } from "@/lib/content/membership";
import { listMembers } from "@/lib/members/service";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Front desk · Members", robots: { index: false } };

const TONE: Record<string, string> = {
  active: "bg-success/15 text-[#1f7a3a]",
  pending: "bg-accent/25 text-accent-deep",
  suspended: "bg-[#fff2f0] text-[#c0392b]",
  expired: "bg-ink/10 text-ink-muted",
};

export default async function AdminMembers() {
  const rows = await listMembers();
  return (
    <div>
      <h1 className="t-2">Members</h1>
      <section className="mt-6 rounded-card-sm bg-white p-5 ring-1 ring-ink/8">
        <h2 className="t-4">Add a member</h2>
        <p className="t-caption mt-1 text-ink-muted">Create the record after vetting. You&apos;ll get a one-time activation code to hand to the member.</p>
        <div className="mt-4">
          <CreateMemberForm />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="t-4">
          All members <span className="text-ink-muted">({rows.length})</span>
        </h2>
        {rows.length === 0 ? (
          <p className="t-body mt-3 text-ink-muted">No members yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-card-sm bg-white ring-1 ring-ink/8">
            <table className="w-full min-w-[720px] text-left text-[0.9375rem]">
              <thead className="t-footnote uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Number</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Locker</th>
                  <th className="px-4 py-3">Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {rows.map((m) => (
                  <tr key={m.id} className="hover:bg-paper">
                    <td className="px-4 py-3">
                      <Link href={`/admin/members/${m.id}`} className="font-medium underline-offset-2 hover:underline">
                        {m.firstName} {m.lastName}
                      </Link>
                      <p className="t-footnote text-ink-muted">{m.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono">{m.memberNumber}</td>
                    <td className="px-4 py-3">
                      {tierByKey(m.tier)?.name ?? m.tier} <span className="t-footnote text-ink-muted">· {m.billing}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("t-footnote rounded-pill px-2 py-0.5 font-semibold capitalize", TONE[m.status] ?? TONE.expired)}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3">{m.lockerNumber ?? <span className="text-ink-faint">None</span>}</td>
                    <td className="px-4 py-3">
                      {m.passwordHash ? <span className="t-footnote text-ink-muted">Activated</span> : <span className="t-footnote font-mono">{m.activationCode ?? "No code"}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
