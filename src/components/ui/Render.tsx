import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * A brass still from public/renders (made by scripts/render-brass.mjs), used in an
 * ImageSlot until the photograph for that slot arrives. Decorative: the slot's own
 * alt text describes the photo it stands in for.
 */
export type RenderName = "casings" | "round-side" | "headstamp" | "pair" | "lineup" | "trio" | "duo" | "rest";

export function Render({ name, sizes = "100vw", className, priority, position }: { name: RenderName; sizes?: string; className?: string; priority?: boolean; position?: string }) {
  return <Image src={`/renders/${name}.webp`} alt="" fill sizes={sizes} priority={priority} className={cn("object-cover", className)} style={position ? { objectPosition: position } : undefined} />;
}
