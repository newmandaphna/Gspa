import { cn } from "@/lib/cn";

export type Theme = "light" | "gray" | "dark" | "black";

/** Three vertical rhythms. Every page uses all three so no two bands sit the same distance apart. */
export type Padding = "tight" | "normal" | "vast";

const themes: Record<Theme, { wrap: string; theme: "light" | "dark" }> = {
  light: { wrap: "bg-paper text-ink", theme: "light" },
  gray: { wrap: "bg-paper-2 text-ink", theme: "light" },
  dark: { wrap: "bg-night-2 text-snow", theme: "dark" },
  black: { wrap: "bg-night text-snow", theme: "dark" },
};

/** tight 48 px, normal 112 px, vast 240 px (a step smaller on phones). */
const paddings: Record<Padding, string> = {
  tight: "py-10 sm:py-12",
  normal: "py-20 sm:py-28",
  vast: "py-32 sm:py-60",
};

type Props = React.HTMLAttributes<HTMLElement> & {
  theme?: Theme;
  as?: "section" | "div" | "header" | "footer";
  /** Vertical rhythm. Ignored when `padded` is false or `bleed` is set. */
  padding?: Padding;
  padded?: boolean;
  bleed?: boolean;
};

/** A full-bleed band. Sets data-theme so children can use `text-muted`, `.link-arrow`, etc. */
export function Section({ theme = "light", as = "section", padding = "normal", padded = true, bleed = false, className, children, ...rest }: Props) {
  const Tag = as;
  const t = themes[theme];
  return (
    <Tag data-theme={t.theme} data-padding={padded && !bleed ? padding : undefined} className={cn("relative w-full", t.wrap, padded && !bleed && paddings[padding], className)} {...rest}>
      {children}
    </Tag>
  );
}
