import { SITE } from "@/lib/config/site";
import { TRAINING_PRELAUNCH } from "@/lib/content/pages/training";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/seo/og";

export const alt = `${SITE.name}: ${TRAINING_PRELAUNCH.hero.headline}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Share card for /training before opening. */
export default function OpenGraphImage() {
  return ogCard({ headline: TRAINING_PRELAUNCH.hero.headline, fact: TRAINING_PRELAUNCH.hero.body });
}
