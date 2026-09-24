"use client";

import Link from "next/link";
import { usePublicClasses } from "@/components/classes/usePublicClasses";
import { Container } from "@/components/ui/Container";
import { Headline } from "@/components/ui/Headline";
import { LinkArrow } from "@/components/ui/LinkArrow";
import { Section } from "@/components/ui/Section";
import { UPCOMING_CLASSES } from "@/lib/content/pages/training";
import { classAvailability, classDateRange, classPrice } from "@/lib/public-classes";

/**
 * The next three dates the desk has posted, one hairline row each. While
 * the list loads, and when nothing is posted, the band does not exist: the
 * home page never promises dates it cannot show. A read failure is said
 * once, with a retry, because silence there would read as "no classes".
 */
export function UpcomingClasses() {
  const data = usePublicClasses();
  const sessions = data.sessions.slice(0, 3);
  if (data.busy || (!data.error && sessions.length === 0)) return null;
  const U = UPCOMING_CLASSES;

  return (
    <Section theme="gray" id="upcoming-classes" aria-labelledby="upcoming-classes-title">
      <Container>
        {data.error ? (
          <div role="alert">
            <Headline id="upcoming-classes-title" size="2" headline={U.error.line} />
            <button type="button" onClick={data.reload} className="link-arrow mt-6">
              {U.error.retry}
            </button>
          </div>
        ) : (
          <>
            <Headline id="upcoming-classes-title" size="2" head={U.head(data.sessions.length)} headline={U.headline} subhead={U.subhead} />
            <ul className="hairline mt-12 border-t" aria-label="Class dates">
              {sessions.map((s) => (
                <li key={s.id} className="hairline border-b">
                  <Link href={`/training/classes?session=${s.id}`} className="group grid gap-x-8 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:py-6 lg:grid-cols-[19rem_minmax(0,1fr)_auto]">
                    <span className="tabular block font-mono text-[0.8125rem] leading-[1.6] text-ink-muted">{classDateRange(s)}</span>
                    <h3 className="t-3 mt-1.5 text-ink transition-colors duration-200 group-hover:text-accent-deep sm:col-span-2 sm:mt-1.5 lg:col-span-1 lg:mt-0">{s.title}</h3>
                    <span className="mt-3 flex flex-wrap items-baseline gap-x-3 sm:col-start-2 sm:row-start-1 sm:mt-0 sm:block sm:text-right lg:col-start-3">
                      <span className="t-4 tabular block whitespace-nowrap text-ink">{classPrice(s.priceCents)}</span>
                      <span className="tabular block whitespace-nowrap font-mono text-[0.8125rem] leading-[1.6] text-ink-muted">{classAvailability(s)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <LinkArrow href={U.link.href} className="mt-8">
              {U.link.label}
            </LinkArrow>
          </>
        )}
      </Container>
    </Section>
  );
}
