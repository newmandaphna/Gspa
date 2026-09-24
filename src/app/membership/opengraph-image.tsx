import { SITE, TIER_WINDOW_DAYS } from "@/lib/config/site";
import { FOUNDERS_CAP } from "@/lib/content/membership";
import { MEMBERSHIP_HERO } from "@/lib/content/pages/membership";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/seo/og";

export const alt = `${SITE.name}: ${MEMBERSHIP_HERO.headline}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Share card for /membership: the headline, then the three windows and the Founders cap. */
export default function OpenGraphImage() {
  const fact = `Members reserve ${TIER_WINDOW_DAYS.club}, ${TIER_WINDOW_DAYS.signature} or ${TIER_WINDOW_DAYS.founders} days ahead. Founders stops at ${FOUNDERS_CAP}.`;
  return ogCard({ headline: MEMBERSHIP_HERO.headline, fact, slot: "FOUNDERS_WALL_01" });
}
