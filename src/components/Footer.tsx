import Link from "next/link";
import { FOOTER_COLUMNS } from "@/lib/content/nav";
import { SITE } from "@/lib/config/site";
import { Wordmark } from "@/components/Wordmark";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer data-theme="light" className="bg-paper-2 text-ink-muted">
      <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Wordmark className="h-4 text-ink" />
            <p className="t-footnote mt-4 max-w-[220px] leading-relaxed">
              A private shooting club and luxury indoor range in {SITE.address.neighborhood}.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[0.75rem] font-semibold text-ink">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="t-footnote transition-colors hover:text-ink hover:underline underline-offset-2">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-ink/10 pt-5">
          <p className="t-footnote leading-relaxed">
            Firearms are handled under the supervision of certified Range Safety Officers. Handguns require a valid New York City pistol license.
            Long guns require government photo ID and are subject to New York State and City law. See{" "}
            <Link href="/visit#requirements" className="underline underline-offset-2 hover:text-ink">
              requirements
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="t-footnote">
              Copyright © {year} {SITE.name}. All rights reserved.
            </p>
            <p className="t-footnote">
              {SITE.address.line1}, {SITE.address.city}, {SITE.address.state} {SITE.address.zip} · {SITE.phone}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
