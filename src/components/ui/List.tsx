import { Children, cloneElement, isValidElement } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/ui/Reveal";

/**
 * The site's three list shapes. Every list on the marketing pages, the
 * reservation flow and the confirmation page is one of these, so rows read
 * the same everywhere: hairline separators, generous padding, one gold mark.
 *
 *   <Rows mark="check">   perks and "includes" lists, optional trailing detail
 *   <Numbered>            steps, rules and requirements, serif index in a fixed column
 *   <Specs>               compact label / value facts (Duration, Price, Guests)
 *
 * Gold adapts to the band: accent-deep on light (AA on white), true gold on dark.
 * Hairlines come from the .hairline class so they also adapt via data-theme.
 */

export type Mark = "check" | "dot" | "none";
export type RowSize = "md" | "sm";

const GOLD = "text-accent-deep [[data-theme=dark]_&]:text-accent";
const GOLD_BG = "bg-accent-deep [[data-theme=dark]_&]:bg-accent";
const MUTED = "text-ink-muted [[data-theme=dark]_&]:text-mist";
const FAINT = "text-ink-faint [[data-theme=dark]_&]:text-mist/80";

/** A thin gold check, stroke 1.5, drawn inline so it inherits currentColor. */
export function CheckMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-4 w-4", className)} fill="none" aria-hidden="true">
      <path d="M3 8.5l3.2 3.2L13 4.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MarkGlyph({ mark, size }: { mark: Mark; size: RowSize }) {
  if (mark === "none") return null;
  if (mark === "check") {
    return (
      <span aria-hidden="true" className={cn("flex w-4 shrink-0 justify-center", GOLD, size === "md" ? "mt-[0.3em]" : "mt-[0.22em]")}>
        <CheckMark />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={cn("flex w-4 shrink-0 justify-center", size === "md" ? "mt-[0.6em]" : "mt-[0.55em]")}>
      <span className={cn("block h-1.5 w-1.5 rounded-full", GOLD_BG)} />
    </span>
  );
}

/* ------------------------------------------------------------------ Rows */

type RowsProps = {
  children: React.ReactNode;
  /** Leading mark for every row; a <Row> can set its own to override. */
  mark?: Mark;
  /** md: t-body with py-3.5 / py-4. sm: 15px type with py-3, for dense cards with many rows. */
  size?: RowSize;
  /** Draw the top hairline (default true). Turn off when the list already sits under a rule. */
  top?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * Hairline-separated rows. Server-renderable, so the list's mark and size are
 * handed to each direct <Row> child rather than read from context.
 */
export function Rows({ children, mark = "none", size = "md", top = true, className, ...rest }: RowsProps) {
  const rows = Children.map(children, (child) => {
    if (!isValidElement<RowProps>(child) || child.type !== Row) return child;
    return cloneElement(child, { mark: child.props.mark ?? mark, size: child.props.size ?? size });
  });
  return (
    <ul className={cn("m-0 list-none p-0", top && "hairline border-t", className)} {...rest}>
      {rows}
    </ul>
  );
}

type RowProps = {
  children: React.ReactNode;
  mark?: Mark;
  size?: RowSize;
  /** Trailing slot: a price, a duration, a mono chip. Kept on one line, right-aligned. */
  detail?: React.ReactNode;
  /** Trailing detail set in mono with tabular figures (default) or as passed. */
  detailMono?: boolean;
  /** Body color: inherit the band (default) or muted. */
  tone?: "default" | "muted";
  className?: string;
};

export function Row({ children, mark = "none", size = "md", detail, detailMono = true, tone = "default", className }: RowProps) {
  const hasDetail = detail !== undefined && detail !== null && detail !== "";
  return (
    <li
      className={cn(
        "hairline flex items-start gap-3.5 border-b sm:gap-4",
        size === "sm" ? "py-3 text-[0.9375rem] leading-[1.45] tracking-[-0.002em]" : "t-body py-3.5 sm:py-4",
        tone === "muted" && MUTED,
        className,
      )}
    >
      <MarkGlyph mark={mark} size={size} />
      <span className="min-w-0 flex-1">{children}</span>
      {hasDetail && (
        <span className={cn("tabular shrink-0 whitespace-nowrap text-right", MUTED, detailMono && "pt-[0.2em] font-mono text-[0.8125rem] leading-[1.45]")}>{detail}</span>
      )}
    </li>
  );
}

/* -------------------------------------------------------------- Numbered */

type NumberedProps = {
  children: React.ReactNode;
  /** Draw the top hairline (default true). */
  top?: boolean;
  className?: string;
  "aria-label"?: string;
};

/** Ordered rows. Children are <NumberedItem index={i}>. */
export function Numbered({ children, top = true, className, ...rest }: NumberedProps) {
  return (
    <ol className={cn("m-0 list-none p-0", top && "hairline border-t", className)} {...rest}>
      {children}
    </ol>
  );
}

type NumberedItemProps = {
  /** Zero-based; rendered as 01, 02, ... */
  index: number;
  children: React.ReactNode;
  /** Mono tag chips under the body (requirements list). */
  tags?: ReadonlyArray<string>;
  /** Screen-reader prefix for the row, e.g. "Rule 1." The visible numeral is decorative. */
  srLabel?: string;
  /** body: t-body. lg: t-3, for the four range rules. */
  size?: "body" | "lg";
  /** When set, the row fades and rises on scroll with this delay (seconds). */
  delay?: number;
  className?: string;
};

/**
 * One numbered row: a two-digit index in the display serif, muted, in a fixed
 * 2.5rem column; the body in t-body; optional mono tag chips beneath it.
 */
export function NumberedItem({ index, children, tags, srLabel, size = "body", delay, className }: NumberedItemProps) {
  const numeral = String(index + 1).padStart(2, "0");
  const rowClass = cn("hairline grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline border-b py-4 sm:py-5", className);
  const content = (
    <>
      <span aria-hidden="true" className={cn("tabular font-[family-name:var(--font-display)] text-[1.375rem] leading-none", FAINT)}>
        {numeral}
      </span>
      <div className="min-w-0">
        <p className={size === "lg" ? "t-3 max-w-[18em]" : "t-body max-w-[34em]"}>
          {srLabel && <span className="sr-only">{srLabel} </span>}
          {children}
        </p>
        {tags && tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Applies to">
            {tags.map((t) => (
              <li key={t} className={cn("inline-flex items-center rounded-pill px-2.5 py-0.5 font-mono text-[0.6875rem] ring-1 ring-inset ring-ink/15 [[data-theme=dark]_&]:ring-white/15", MUTED)}>
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
  if (delay !== undefined) {
    return (
      <Reveal as="li" delay={delay} className={rowClass}>
        {content}
      </Reveal>
    );
  }
  return <li className={rowClass}>{content}</li>;
}

/* ----------------------------------------------------------------- Specs */

export type Spec = { label: string; value: React.ReactNode };

type SpecsProps = {
  items: ReadonlyArray<Spec>;
  /** Draw the top hairline (default true). */
  top?: boolean;
  className?: string;
  "aria-label"?: string;
};

/** Compact two-column facts: label in small caps on the left, tabular value on the right. */
export function Specs({ items, top = true, className, ...rest }: SpecsProps) {
  return (
    <dl className={cn("m-0", top && "hairline border-t", className)} {...rest}>
      {items.map((s) => (
        <div key={s.label} className="hairline grid grid-cols-[minmax(6.5rem,2fr)_minmax(0,3fr)] items-baseline gap-x-4 border-b py-3 sm:py-3.5">
          <dt className={cn("t-footnote uppercase tracking-[0.14em]", MUTED)}>{s.label}</dt>
          <dd className="t-body-lg tabular m-0 min-w-0">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
