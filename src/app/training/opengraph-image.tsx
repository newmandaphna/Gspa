import { SITE } from "@/lib/config/site";
import { HERO } from "@/lib/content/pages/training";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/seo/og";

export const alt = `${SITE.name}: ${HERO.headline}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Share card for /training. */
export default function OpenGraphImage() {
  return ogCard({ headline: HERO.headline, fact: HERO.subhead, slot: HERO.imageSlot });
}
