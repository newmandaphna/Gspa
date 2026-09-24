import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLDivElement> & { size?: "sm" | "md" | "lg" | "xl" | "full" };

const sizes = {
  sm: "max-w-[680px]",
  md: "max-w-[980px]",
  lg: "max-w-[1180px]",
  xl: "max-w-[1440px]",
  full: "max-w-none",
};

export function Container({ size = "lg", className, ...rest }: Props) {
  return <div className={cn("mx-auto w-full px-5 sm:px-8", sizes[size], className)} {...rest} />;
}
