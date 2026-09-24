import { cn } from "@/lib/cn";

export type Theme = "light" | "gray" | "dark" | "black";

const themes: Record<Theme, { wrap: string; theme: "light" | "dark" }> = {
  light: { wrap: "bg-paper text-ink", theme: "light" },
  gray: { wrap: "bg-paper-2 text-ink", theme: "light" },
  dark: { wrap: "bg-night-2 text-snow", theme: "dark" },
  black: { wrap: "bg-night text-snow", theme: "dark" },
};

type Props = React.HTMLAttributes<HTMLElement> & {
  theme?: Theme;
  as?: "section" | "div" | "header" | "footer";
  padded?: boolean;
  bleed?: boolean;
};

/** A full-bleed band. Sets data-theme so children can use `text-muted`, `.link-arrow`, etc. */
export function Section({ theme = "light", as = "section", padded = true, bleed = false, className, children, ...rest }: Props) {
  const Tag = as;
  const t = themes[theme];
  return (
    <Tag
      data-theme={t.theme}
      className={cn("relative w-full", t.wrap, padded && !bleed && "py-20 sm:py-28 lg:py-32", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
