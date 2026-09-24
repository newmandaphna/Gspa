import Link from "next/link";
import { LiveStatus } from "@/components/LiveStatus";
import { Wordmark } from "@/components/Wordmark";
import { Owner } from "@/components/ui/Owner";
import { SITE } from "@/lib/config/site";
import { FOOTER_COLUMNS, HOUSE_RULES_LINK, type NavItem } from "@/lib/content/nav";
import { computeOpenStatus } from "@/lib/hours";

/** The six text links. Members and Legal come from nav.ts so one edit renames them everywhere. */
function pick(title: string, label: string): NavItem | undefined {
  return FOOTER_COLUMNS.find((c) => c.title === title)?.links.find((l) => l.label === label);
}

const ROW: NavItem[] = [
  { label: "Reserve", href: "/reserve" },
  { label: "Manage a reservation", href: "/reserve/manage" },
  pick("Members", "Sign in") ?? { label: "Sign in", href: "/members/login" },
  pick("Members", "Apply") ?? { label: "Apply", href: "/membership#apply" },
  HOUSE_RULES_LINK,
  { label: "FAQ", href: "/visit#faq" },
];

/** The rest of the Legal column, set small under the row. */
const LEGAL: NavItem[] = (FOOTER_COLUMNS.find((c) => c.title === "Legal")?.links ?? []).filter((l) => l.href !== HOUSE_RULES_LINK.href);

const PHONE_HREF = `tel:${SITE.phone.replace(/[^\d+]/g, "")}`;

/**
 * One dark band. Wordmark, the live status in serif, the address as a Maps
 * link, the phone as tel:, Instagram, one row of six links, then the legal
 * links and the year in mono. The range license number goes in the footnote
 * once the owner supplies it (RANGE_LICENSE below).
 */
const RANGE_LICENSE: string | null = null; // TODO(owner): NYS range license number, printed in the footnote when set

export function Footer({ id }: { id?: string }) {
  const year = new Date().getFullYear();
  const status = computeOpenStatus(new Date());
  return (
    <footer id={id} data-theme="dark" className="bg-night pb-16 text-snow md:pb-0">
      <div className="mx-auto max-w-[1180px] px-5 pb-10 pt-14 sm:px-8 sm:pt-20">
        <div className="grid gap-10 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-16">
          <div>
            <Wordmark tone="current" className="text-[26px]" />
            <p className="t-3 mt-6 text-snow">
              <LiveStatus initial={status} variant="dot" field="short" className="gap-3" dotClassName="h-2 w-2" />
            </p>
            <p className="mt-2 font-mono text-[0.8125rem] text-mist">
              <Link href="/visit#hours" className="underline-offset-4 hover:underline">
                Hours
              </Link>
            </p>
          </div>
          <address className="not-italic md:text-right">
            <a href={SITE.address.googleMapsUrl} target="_blank" rel="noreferrer" className="t-body-lg block text-snow underline-offset-4 hover:underline">
              {SITE.address.line1}
              <br />
              {SITE.address.city}, {SITE.address.state} {SITE.address.zip}
            </a>
            <Owner as="a" value={SITE.phone} href={PHONE_HREF} className="t-body-lg tabular mt-4 block text-snow underline-offset-4 hover:underline" />
            <a href={SITE.social.instagram} target="_blank" rel="noreferrer" className="t-body mt-4 inline-block text-mist underline-offset-4 hover:text-snow hover:underline">
              Instagram
            </a>
          </address>
        </div>

        <nav aria-label="Footer" className="mt-14 border-t border-white/10 pt-6">
          <ul className="flex flex-wrap gap-x-7 gap-y-3">
            {ROW.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[0.9375rem] text-snow/85 underline-offset-4 transition-colors hover:text-snow hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-8 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.6875rem] text-mist/80">
          <span>
            © {year} {SITE.name}
          </span>
          {LEGAL.map((l) => (
            <Link key={l.href} href={l.href} className="underline-offset-4 hover:text-snow hover:underline">
              {l.label}
            </Link>
          ))}
          {RANGE_LICENSE && <span>Range license {RANGE_LICENSE}</span>}
        </p>
      </div>
    </footer>
  );
}
