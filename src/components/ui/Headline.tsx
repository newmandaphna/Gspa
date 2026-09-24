import { cn } from "@/lib/cn";
import { Eyebrow } from "@/components/ui/Eyebrow";

type Props = {
  /** Mono running head that states a fact. Omit it when there is no fact to state. */
  head?: React.ReactNode;
  headline: React.ReactNode;
  /** Set in the italic serif. Carries a fact the headline lacks, or it is left out. */
  subhead?: React.ReactNode;
  body?: React.ReactNode;
  /** Anything that sits under the body: a link, a price line. */
  children?: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  size?: "hero" | "1" | "2";
  /**
   * stack: head, headline, subhead, body in one column.
   * beside: headline and subhead in the left five columns, body and children in the right seven.
   */
  layout?: "stack" | "beside";
  id?: string;
  className?: string;
};

const sizes = { hero: "t-hero", "1": "t-1", "2": "t-2" } as const;

/** The one headline stack the marketing pages share. Text sits still: no reveal wrapper. */
export function Headline({ head, headline, subhead, body, children, as: Tag = "h2", size = "1", layout = "stack", id, className }: Props) {
  const title = (
    <>
      {head && <Eyebrow className="mb-4">{head}</Eyebrow>}
      <Tag id={id} className={cn(sizes[size], "max-w-[14em]")}>
        {headline}
      </Tag>
      {subhead && <p className="t-subhead mt-3 max-w-[26em] text-muted">{subhead}</p>}
    </>
  );
  const rest = (
    <>
      {body && <p className="t-body-lg max-w-[40em] text-muted">{body}</p>}
      {children}
    </>
  );
  if (layout === "beside") {
    return (
      <div className={cn("grid gap-8 lg:grid-cols-12 lg:gap-10", className)}>
        <div className="lg:col-span-5">{title}</div>
        <div className="lg:col-span-7 lg:pt-2">{rest}</div>
      </div>
    );
  }
  return (
    <div className={cn("max-w-[720px]", className)}>
      {title}
      {(body || children) && <div className="mt-6">{rest}</div>}
    </div>
  );
}
