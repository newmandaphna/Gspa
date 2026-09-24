import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelRequestAction, signOutAction } from "@/app/members/actions";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reticle } from "@/components/art";
import { LOCKERS_TOTAL, tierSatisfies } from "@/lib/config/site";
import { MEMBER_SERVICES, tierByKey } from "@/lib/content/membership";
import { getCurrentMember } from "@/lib/members/auth";
import { listMemberBookings, listMemberRequests, REQUEST_KINDS } from "@/lib/members/service";
import { formatInstant, formatMoney } from "@/lib/time";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your membership", robots: { index: false } };

const STATUS_TONE: Record<string, string> = {
  requested: "bg-accent/25 text-accent-deep",
  approved: "bg-success/15 text-[#1f7a3a]",
  fulfilled: "bg-ink/10 text-ink",
  declined: "bg-ink/10 text-ink-muted",
  cancelled: "bg-ink/5 text-ink-faint",
};

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ welcome?: string; requested?: string }> }) {
  const member = await getCurrentMember();
  if (!member) redirect("/members/login?next=/members");
  const { welcome, requested } = await searchParams;
  const [upcoming, requests] = await Promise.all([listMemberBookings(member.id, { upcomingOnly: true }), listMemberRequests({ memberId: member.id })]);
  const tier = tierByKey(member.tier);
  const renews = member.renewsAt
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(member.renewsAt)
    : null;

  return (
    <>
      <Section theme="black" className="grain overflow-hidden pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4rem)] !pb-16">
        <Container>
          {welcome && <p className="t-caption mb-6 inline-flex rounded-pill bg-accent/20 px-3 py-1 font-semibold text-accent-2">Account activated. Welcome to the club.</p>}
          {requested && <p className="t-caption mb-6 inline-flex rounded-pill bg-accent/20 px-3 py-1 font-semibold text-accent-2">Request received. The team will confirm shortly.</p>}
          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="t-eyebrow text-accent">{tier?.name ?? member.tier} member</p>
              <h1 className="t-hero mt-3">Good to see you, {member.firstName}.</h1>
              <p className="t-lead mt-4 max-w-[560px] text-mist">
                {upcoming.length ? `You have ${upcoming.length} upcoming reservation${upcoming.length === 1 ? "" : "s"}.` : "Nothing on the calendar yet. The lanes are waiting."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/reserve" size="lg">
                Reserve
              </Button>
              <form action={signOutAction}>
                <Button type="submit" variant="secondary" size="lg">
                  Sign out
                </Button>
              </form>
            </div>
          </div>

          {/* Membership card */}
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-card bg-[linear-gradient(150deg,#2c2c2e_0%,#151516_55%,#0a0a0b_100%)] p-6 ring-1 ring-white/10 md:col-span-2">
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)]" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="t-eyebrow text-mist">Member number</p>
                  <p className="mt-1 font-mono text-[1.5rem] font-semibold tracking-wide">{member.memberNumber}</p>
                </div>
                <Reticle className="h-8 w-8 text-accent-2" />
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                <Stat label="Tier" value={tier?.name ?? member.tier} />
                <Stat label={member.billing === "lifetime" ? "Term" : "Renews"} value={member.billing === "lifetime" ? "Lifetime" : (renews ?? "Not set")} />
                <Stat label="Guests per visit" value={String(tier?.guestsPerVisit ?? 1)} />
                <Stat label="Booking window" value={`${tier?.bookingWindowDays ?? 60} days`} />
              </dl>
            </div>
            <div className="grid gap-4">
              <div className="rounded-card bg-night-2 p-6 ring-1 ring-white/10">
                <p className="t-eyebrow text-mist">Locker</p>
                <p className="t-3 mt-2">{member.lockerNumber ? `No. ${member.lockerNumber}` : "None assigned"}</p>
                {!member.lockerNumber && (
                  <Link href="/members/requests/new?kind=locker" className="link-arrow mt-2 text-[0.9375rem]">
                    Request one ({LOCKERS_TOTAL} on site)
                  </Link>
                )}
              </div>
              <div className="rounded-card bg-night-2 p-6 ring-1 ring-white/10">
                <p className="t-eyebrow text-mist">Guest passes</p>
                <p className="t-3 mt-2">{member.guestPassesRemaining} remaining</p>
                <Link href="/members/requests/new?kind=guest_pass" className="link-arrow mt-2 text-[0.9375rem]">
                  Request more
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section theme="light">
        <Container>
          <h2 className="t-1">Members only.</h2>
          <p className="t-lead mt-3 max-w-[640px] text-ink-muted">Everything the card unlocks. Book it, or ask and we&apos;ll handle it.</p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MEMBER_SERVICES.map((s) => {
              const allowed = tierSatisfies(member.tier, s.minTier);
              return (
                <li key={s.title}>
                  <Link
                    href={allowed ? s.href : "/membership#tiers"}
                    className={cn(
                      "group flex h-full flex-col rounded-card bg-white p-6 ring-1 ring-ink/8 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-apple)] hover:-translate-y-0.5",
                      !allowed && "opacity-60",
                    )}
                  >
                    <span className="t-eyebrow text-ink-faint">{s.kind === "book" ? "Book" : "Request"}</span>
                    <span className="t-3 mt-2">{s.title}</span>
                    <span className="t-body mt-1 text-ink-muted">{s.description}</span>
                    <span className="link-arrow mt-auto pt-6 text-[0.9375rem]">{allowed ? (s.kind === "book" ? "Reserve" : "Ask the team") : `${tierByKey(s.minTier!)?.name} and above`}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      <Section theme="gray">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="t-2">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="t-body mt-4 text-ink-muted">No reservations yet.</p>
            ) : (
              <ul className="mt-6 divide-y divide-ink/10 rounded-card bg-white ring-1 ring-ink/8">
                {upcoming.map(({ booking, experience }) => (
                  <li key={booking.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div>
                      <p className="t-4">{experience.name}</p>
                      <p className="t-caption text-ink-muted">
                        {formatInstant(booking.startsAt)} · {booking.guests} guest{booking.guests === 1 ? "" : "s"} · {formatMoney(booking.amountCents)}
                      </p>
                    </div>
                    <Link href={`/reserve/confirmation/${booking.code}`} className="link-arrow text-[0.9375rem]">
                      Details
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="t-2">Requests</h2>
            {requests.length === 0 ? (
              <p className="t-body mt-4 text-ink-muted">Nothing pending. Lockers, guest passes and storage requests show up here.</p>
            ) : (
              <ul className="mt-6 divide-y divide-ink/10 rounded-card bg-white ring-1 ring-ink/8">
                {requests.map(({ request }) => (
                  <li key={request.id} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="t-4">{REQUEST_KINDS[request.kind as keyof typeof REQUEST_KINDS] ?? request.kind}</p>
                      <span className={cn("t-footnote rounded-pill px-2.5 py-1 font-semibold capitalize", STATUS_TONE[request.status] ?? STATUS_TONE.fulfilled)}>{request.status}</span>
                    </div>
                    <p className="t-caption mt-1 text-ink-muted">{request.details}</p>
                    {request.staffNotes && <p className="t-caption mt-1 text-ink">Team: {request.staffNotes}</p>}
                    {request.status === "requested" && (
                      <form action={cancelRequestAction} className="mt-2">
                        <input type="hidden" name="id" value={request.id} />
                        <button type="submit" className="t-footnote text-ink-muted underline underline-offset-2 hover:text-ink">
                          Withdraw
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/members/account" className="link-arrow mt-6 text-[0.9375rem]">
              Account settings
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="t-footnote text-mist">{label}</dt>
      <dd className="t-4 mt-0.5">{value}</dd>
    </div>
  );
}
