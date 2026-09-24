import { SITE } from "@/lib/config/site";
import { HERO } from "@/lib/content/pages/home";
import { OG_CONTENT_TYPE, OG_FACT_LINE, OG_SIZE, ogCard } from "@/lib/seo/og";

export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Social share card for the home page: the tagline in the brand serif, "Relax!" in gold italic. */
export default function OpenGraphImage() {
  const headline = SITE.tagline.endsWith("Relax!") ? SITE.tagline.replace(/Relax!$/, "*Relax!*") : SITE.tagline;
  return ogCard({ headline, fact: OG_FACT_LINE, slot: HERO.imageSlot });
}
