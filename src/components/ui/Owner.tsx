import { createElement, type ElementType, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { isPlaceholder } from "@/lib/seo/placeholders";

type OwnerProps<T extends ElementType> = {
  /** The fact being shown. When it still holds a bracket or 000-0000 the element is faint in development and gone in production. */
  value: string;
  /** The element to render. Defaults to a span. */
  as?: T;
  className?: string;
  /** What to render inside; defaults to the value itself. */
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "className" | "children">;

/**
 * A fact the owner has not confirmed yet.
 *
 * Confirmed values render exactly as written, so once the owner fills in
 * site.ts nothing here changes. A placeholder value (see
 * src/lib/seo/placeholders.ts) renders faint with the title "Owner to confirm"
 * in development, and is omitted entirely in production, so "(718) 000-0000"
 * and "[Q7] bus" never reach a visitor. The CONTENT_FINAL build gate is the
 * permanent check; this is the interim one.
 */
export function Owner<T extends ElementType = "span">({ value, as, className, children, ...rest }: OwnerProps<T>) {
  const tag: ElementType = as ?? "span";
  if (!isPlaceholder(value)) {
    return createElement(tag, { className, ...rest }, children ?? value);
  }
  if (process.env.NODE_ENV === "production") return null;
  return createElement(
    tag,
    { className: cn("opacity-40", className), title: "Owner to confirm", "data-owner": "placeholder", ...rest },
    children ?? value,
  );
}
