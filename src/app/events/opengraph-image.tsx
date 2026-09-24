import { SITE } from "@/lib/config/site";
import { EVENTS_HERO } from "@/lib/content/pages/events";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/seo/og";

export const alt = `${SITE.name}: ${EVENTS_HERO.headline}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Share card for /events: the headline and the three room sizes. */
export default function OpenGraphImage() {
  return ogCard({ headline: EVENTS_HERO.headline, fact: EVENTS_HERO.subhead ?? "", slot: "EVENTS_PHOTO_01" });
}
