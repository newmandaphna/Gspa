import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium whitespace-nowrap select-none transition-[background-color,color,transform,box-shadow,opacity] duration-200 ease-[var(--ease-apple)] disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]";

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.9375rem]",
  md: "h-11 px-[22px] text-[1.0625rem]",
  lg: "h-[52px] px-7 text-[1.125rem]",
};

/** Variants adapt to the surrounding data-theme (dark sections invert). */
const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-snow hover:bg-night-3 [[data-theme=dark]_&]:bg-snow [[data-theme=dark]_&]:text-ink [[data-theme=dark]_&]:hover:bg-white",
  secondary:
    "bg-transparent text-ink ring-1 ring-inset ring-ink/25 hover:bg-ink/5 [[data-theme=dark]_&]:text-snow [[data-theme=dark]_&]:ring-white/30 [[data-theme=dark]_&]:hover:bg-white/10",
  ghost: "bg-ink/6 text-ink hover:bg-ink/10 [[data-theme=dark]_&]:bg-white/10 [[data-theme=dark]_&]:text-snow [[data-theme=dark]_&]:hover:bg-white/15",
  accent: "bg-accent text-night hover:bg-accent-2",
  link: "h-auto px-0 rounded-none text-link-ink hover:underline underline-offset-4 [[data-theme=dark]_&]:text-link",
};

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: React.ReactNode };
type LinkProps = CommonProps & { href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">;
type ButtonProps = CommonProps & { href?: undefined } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button(props: LinkProps | ButtonProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const cls = cn(base, sizes[size], variants[variant], className);
  if ("href" in props && props.href) {
    const { href, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props as LinkProps;
    void _v; void _s; void _c; void _ch;
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  const { variant: _v, size: _s, className: _c, children: _ch, href: _h, ...rest } = props as ButtonProps;
  void _v; void _s; void _c; void _ch; void _h;
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
