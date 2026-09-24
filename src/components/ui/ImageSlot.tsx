import Image from "next/image";
import { cn } from "@/lib/cn";

type Props = {
  /** Identifier used in MEDIA.md so the owner knows which photo goes here. */
  slot: string;
  /** Once you have a photo, drop it in /public/media and pass its path. */
  src?: string;
  alt: string;
  className?: string;
  /** Fallback art while no photo exists. */
  art?: React.ReactNode;
  priority?: boolean;
  sizes?: string;
};

/**
 * A photo placeholder that still looks finished. Renders real imagery when
 * `src` is provided, otherwise the supplied CSS/SVG art. Every slot is
 * discoverable via [data-image-slot].
 */
export function ImageSlot({ slot, src, alt, className, art, priority, sizes = "100vw" }: Props) {
  return (
    <div data-image-slot={slot} className={cn("relative overflow-hidden", className)}>
      {src ? (
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      ) : (
        <div className="absolute inset-0" role="img" aria-label={alt}>
          {art}
        </div>
      )}
    </div>
  );
}
