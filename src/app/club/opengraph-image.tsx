import { SITE } from "@/lib/config/site";
import { CLUB_HERO } from "@/lib/content/pages/club";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/seo/og";

export const alt = `${SITE.name}: ${CLUB_HERO.headline}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Share card for /club: the club headline over the range-floor photo once it exists. */
export default function OpenGraphImage() {
  return ogCard({ headline: CLUB_HERO.headline, fact: CLUB_HERO.body ?? "", slot: "CLUB_PHOTO_01" });
}
