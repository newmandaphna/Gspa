import type { Metadata } from "next";
import { listInquiries } from "@/lib/inquiries";
import { formatInstant } from "@/lib/time";

export const metadata: Metadata = { title: "Front desk · Inquiries", robots: { index: false } };

export default async function AdminInquiries() {
  const rows = await listInquiries(200);
  return (
    <div>
      <h1 className="t-2">Inquiries</h1>
      <p className="t-body mt-1 text-ink-muted">Event, membership and general inquiries from the website.</p>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
