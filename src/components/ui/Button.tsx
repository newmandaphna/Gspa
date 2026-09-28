import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "link";
type Size = "sm" | "md" | "lg";

/**
 * Machined buttons: square corners, Archivo expanded capitals, wide tracking.
 * Hover fills with brass; press sinks a pixel. No pills, no bounce.
 */
const base =
  "group/btn relative inline-flex items-center justify-center gap-3 rounded-[2px] font-display font-[680] uppercase [font-stretch:115%] tracking-[0.14em] whitespace-nowrap select-none transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-snap)] disabled:opacity-40 disabled:pointer-events-none active:translate-y-px";

const sizes: Record<Size, string> = {
  sm: "h-10 px-5 text-[0.6875rem]",
  md: "h-12 px-7 text-[0.75rem]",
  lg: "h-14 px-9 text-[0.8125rem]",
};

/** Variants adapt to the surrounding data-theme (dark sections invert). */
const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-snow hover:bg-accent hover:text-night [[data-theme=dark]_&]:bg-snow [[data-theme=dark]_&]:text-ink [[data-theme=dark]_&]:hover:bg-accent",
  secondary:
    "bg-transparent text-ink shadow-[inset_0_0_0_1px_rgba(20,18,16,0.35)] hover:bg-ink hover:text-snow [[data-theme=dark]_&]:text-snow [[data-theme=dark]_&]:shadow-[inset_0_0_0_1px_rgba(242,239,233,0.35)] [[data-theme=dark]_&]:hover:bg-snow [[data-theme=dark]_&]:hover:text-ink",
  ghost: "bg-ink/[0.06] text-ink hover:bg-ink/10 [[data-theme=dark]_&]:bg-white/[0.08] [[data-theme=dark]_&]:text-snow [[data-theme=dark]_&]:hover:bg-white/15",
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
