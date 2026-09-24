import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { regenerateActivationAction, updateMemberAction } from "@/app/admin/actions";
import { adminInput } from "@/components/admin/AdminForms";
import { TIERS } from "@/lib/config/site";
import { MEMBERSHIP_TIERS } from "@/lib/content/membership";
import { getMemberById, listMemberBookings, listMemberRequests, REQUEST_KINDS } from "@/lib/members/service";
import { formatInstant, formatMoney } from "@/lib/time";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Front desk · Member", robots: { index: false } };

export default async function AdminMemberDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; saved?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const memberId = Number(id);
  if (!Number.isInteger(memberId)) notFound();
  const member = await getMemberById(memberId);
  if (!member) notFound();
  const [bookings, requests] = await Promise.all([listMemberBookings(member.id, { upcomingOnly: true }), listMemberRequests({ memberId: member.id })]);
  const renews = member.renewsAt ? member.renewsAt.toISOString().slice(0, 10) : "";

  return (
    <div>
      <p className="t-caption">
        <Link href="/admin/members" className="underline underline-offset-2">
          Members
        </Link>{" "}
        / {member.memberNumber}
      </p>
      <h1 className="t-2 mt-2">
        {member.firstName} {member.lastName}
      </h1>
      <p className="t-body text-ink-muted">
        {member.email}
        {member.phone ? ` · ${member.phone}` : ""}
      </p>

      {sp.created && (
        <div className="mt-6 rounded-card-sm bg-night p-5 text-snow" data-theme="dark">
          <p className="t-eyebrow text-accent-2">Member created</p>
          <p className="t-body mt-2">Hand the member their number and one-time activation code. They activate at /members/activate.</p>
          <p className="mt-3 font-mono text-[1.5rem] font-semibold tracking-wide">
            {member.memberNumber} · {member.activationCode}
          </p>
        </div>
      )}
      {sp.saved && <p className="t-caption mt-4 inline-flex rounded-pill bg-success/15 px-3 py-1 font-semibold text-[#1f7a3a]">Saved.</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form action={updateMemberAction} className="grid gap-4 rounded-card-sm bg-white p-5 ring-1 ring-ink/8 sm:grid-cols-2">
          <input type="hidden" name="id" value={member.id} />
          <Field label="First name" name="firstName" defaultValue={member.firstName} />
          <Field label="Last name" name="lastName" defaultValue={member.lastName} />
          <Field label="Phone" name="phone" defaultValue={member.phone ?? ""} />
          <div>
            <label htmlFor="status" className="t-caption font-semibold">
              Status
            </label>
            <select id="status" name="status" defaultValue={member.status} className={adminInput}>
              {["pending", "active", "suspended", "expired"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tier" className="t-caption font-semibold">
              Tier
            </label>
            <select id="tier" name="tier" defaultValue={member.tier} className={adminInput}>
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {MEMBERSHIP_TIERS.find((x) => x.key === t)?.name ?? t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="billing" className="t-caption font-semibold">
              Billing
            </label>
            <select id="billing" name="billing" defaultValue={member.billing} className={adminInput}>
              <option value="annual">Annual</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
          <div>
            <label htmlFor="renewsAt" className="t-caption font-semibold">
              Renews on <span className="font-normal text-ink-muted">(annual only)</span>
            </label>
            <input id="renewsAt" name="renewsAt" type="date" defaultValue={renews} className={adminInput} />
          </div>
          <Field label="Locker number" name="lockerNumber" defaultValue={member.lockerNumber ?? ""} />
          <div>
            <label htmlFor="guestPassesRemaining" className="t-caption font-semibold">
              Guest passes remaining
            </label>
            <input id="guestPassesRemaining" name="guestPassesRemaining" type="number" min={0} defaultValue={member.guestPassesRemaining} className={adminInput} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="notes" className="t-caption font-semibold">
              Internal notes
            </label>
            <textarea id="notes" name="notes" rows={3} defaultValue={member.notes ?? ""} className={cn(adminInput, "h-auto py-2")} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="h-10 rounded-pill bg-ink px-5 text-[0.9375rem] font-medium text-snow">
              Save changes
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-card-sm bg-white p-5 ring-1 ring-ink/8">
            <p className="t-4">Portal login</p>
            {member.passwordHash ? (
              <p className="t-caption mt-1 text-ink-muted">Activated. Regenerating a code lets the member set a new password.</p>
            ) : (
              <p className="t-caption mt-1 text-ink-muted">
                Not activated. Code: <span className="font-mono text-ink">{member.activationCode ?? "—"}</span>
              </p>
            )}
            <form action={regenerateActivationAction} className="mt-3">
              <input type="hidden" name="id" value={member.id} />
              <button type="submit" className="t-caption rounded-pill px-3 py-1.5 font-semibold ring-1 ring-inset ring-ink/15 hover:bg-paper">
                Regenerate activation code
              </button>
            </form>
          </div>
          <div className="rounded-card-sm bg-white p-5 ring-1 ring-ink/8">
            <p className="t-4">Upcoming reservations</p>
            {bookings.length === 0 ? (
              <p className="t-caption mt-1 text-ink-muted">None.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {bookings.map(({ booking, experience }) => (
                  <li key={booking.id} className="t-caption">
                    {formatInstant(booking.startsAt)} · {experience.name} · {formatMoney(booking.amountCents)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-card-sm bg-white p-5 ring-1 ring-ink/8">
            <p className="t-4">Requests</p>
            {requests.length === 0 ? (
              <p className="t-caption mt-1 text-ink-muted">None.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {requests.map(({ request }) => (
                  <li key={request.id} className="t-caption">
                    <span className="font-medium">{REQUEST_KINDS[request.kind as keyof typeof REQUEST_KINDS] ?? request.kind}</span> · {request.status}
                    <span className="block text-ink-muted">{request.details}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/requests" className="link-arrow mt-2 text-[0.875rem]">
              All requests
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label htmlFor={name} className="t-caption font-semibold">
        {label}
      </label>
      <input id={name} name={name} defaultValue={defaultValue} className={adminInput} />
    </div>
  );
}
