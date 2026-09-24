import Image, { getImageProps } from "next/image";
import { cn } from "@/lib/cn";
import { mediaFor, type MediaEntry } from "@/lib/media/manifest";
import { SlotVideo } from "@/components/ui/SlotVideo";

export type SlotVideoSources = {
  /** H.265 or H.264 mp4, under 4 MB (see MEDIA.md). */
  mp4?: string;
  /** VP9 webm, same clip. */
  webm?: string;
  /** Shown before the first frame and wherever the clip is disabled. Defaults to the slot's photo. */
  poster?: string;
};

type Props = {
  /** Identifier used in MEDIA.md so the owner knows which photo goes here. */
  slot: string;
  /**
   * Explicit path override. Normally unnecessary: a file in public/media named after
   * the slot (hero_photo_01.jpg) is picked up through src/lib/media/manifest.ts.
   */
  src?: string;
  alt: string;
  className?: string;
  /** Fallback art while no photo exists. */
  art?: React.ReactNode;
  priority?: boolean;
  sizes?: string;
  /** Fill the nearest positioned ancestor (full-bleed backgrounds). */
  fill?: boolean;
  /** A silent loop layered over the still. Disabled under reduced motion or Save-Data. */
  video?: SlotVideoSources;
};

/**
 * A photo slot that still looks finished before the photo exists.
 *
 * Resolution order: the media manifest (photo plus optional portrait
 * companion, blur placeholder, AVIF and WebP through next/image), then an
 * explicit `src`, then the supplied art. Every slot is discoverable in the DOM
 * via [data-image-slot] and keeps the same box whichever layer renders, so a
 * photo drops in later without a layout change.
 */
export function ImageSlot({ slot, src, alt, className, art, priority, sizes = "100vw", fill = false, video }: Props) {
  const entry = mediaFor(slot);
  const still = entry ? (
    <Picture entry={entry} alt={alt} sizes={sizes} priority={priority} />
  ) : src ? (
    <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
  ) : (
    <div className="absolute inset-0" role="img" aria-label={alt}>
      {art}
    </div>
  );
  const hasVideo = Boolean(video?.mp4 || video?.webm);

  return (
    <div data-image-slot={slot} data-media={entry ? "photo" : src ? "photo" : "art"} className={cn(fill ? "absolute inset-0" : "relative", "overflow-hidden", className)}>
      {hasVideo ? (
        <SlotVideo mp4={video?.mp4} webm={video?.webm} poster={video?.poster ?? entry?.src ?? src}>
          {still}
        </SlotVideo>
      ) : (
        still
      )}
    </div>
  );
}

/** <picture> with a portrait source for phones, both through the next/image loader. */
function Picture({ entry, alt, sizes, priority }: { entry: MediaEntry; alt: string; sizes: string; priority?: boolean }) {
  const common = { alt, sizes, priority, fill: true as const, placeholder: "blur" as const };
  const { props: landscape } = getImageProps({ ...common, src: entry.src, blurDataURL: entry.blurDataURL });
  const portrait = entry.portrait ? getImageProps({ ...common, src: entry.portrait.src, blurDataURL: entry.portrait.blurDataURL }).props : null;
  return (
    <picture>
      {portrait && <source media="(orientation: portrait)" srcSet={portrait.srcSet} sizes={portrait.sizes} />}
      {/* Props come from getImageProps, the documented way to build a <picture> around next/image. */}
      <img {...landscape} alt={alt} className="object-cover" />
    </picture>
  );
}
