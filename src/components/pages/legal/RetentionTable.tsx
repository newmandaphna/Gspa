import { RETENTION_HEADERS, type RetentionRow } from "@/lib/content/pages/legal";

/**
 * The retention schedule as a hairline table. Three columns from 640px up;
 * on phones each row stacks with the column name as a small label so the
 * whole table stays inside a 34em measure.
 */
export function RetentionTable({ rows }: { rows: RetentionRow[] }) {
  const cols = "sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,0.9fr)]";
  return (
    <div className="mt-8" role="table" aria-label="Retention schedule">
      <div role="rowgroup" className="hidden sm:block">
        <div role="row" className={`grid gap-x-6 border-b border-hairline pb-3 ${cols}`}>
          <span role="columnheader" className="t-eyebrow text-ink-faint">
            {RETENTION_HEADERS.data}
          </span>
          <span role="columnheader" className="t-eyebrow text-ink-faint">
            {RETENTION_HEADERS.why}
          </span>
          <span role="columnheader" className="t-eyebrow text-ink-faint">
            {RETENTION_HEADERS.howLong}
          </span>
        </div>
      </div>
      <div role="rowgroup">
        {rows.map((r) => (
          <div key={r.data} role="row" className={`grid gap-x-6 gap-y-2 border-b border-hairline py-4 ${cols}`}>
            <div role="cell" className="t-body font-medium text-ink">
              {r.data}
            </div>
            <div role="cell" className="t-caption text-ink-muted">
              <span className="t-eyebrow mr-2 text-ink-faint sm:hidden">{RETENTION_HEADERS.why}</span>
              {r.why}
            </div>
            <div role="cell" className="font-mono text-[0.8125rem] leading-[1.5] text-ink-muted">
              <span className="t-eyebrow mr-2 font-sans text-ink-faint sm:hidden">{RETENTION_HEADERS.howLong}</span>
              {r.howLong}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
