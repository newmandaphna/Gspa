import { SITE } from "@/lib/config/site";
import { MEMBERSHIP_PRELAUNCH } from "@/lib/content/pages/membership";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/seo/og";

export const alt = `${SITE.name}: ${MEMBERSHIP_PRELAUNCH.hero.headline}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Share card for /membership before opening: who membership is for. */
export default function OpenGraphImage() {
  return ogCard({ headline: MEMBERSHIP_PRELAUNCH.hero.headline, fact: "Tiers, benefits and pricing are announced before opening." });
}
