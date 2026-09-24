import { SITE } from "@/lib/config/site";
import { VISIT_HERO, VISIT_HOURS } from "@/lib/content/pages/visit";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/seo/og";

export const alt = `${SITE.name}, ${SITE.address.line1}, ${SITE.address.neighborhood}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Share card for /visit: the neighbourhood as the headline, the hours as the fact, the street address as the running head. */
export default function OpenGraphImage() {
  return ogCard({
    headline: VISIT_HERO.headline,
    fact: `${VISIT_HERO.subhead ?? ""} ${VISIT_HOURS.headline}`.trim(),
    head: `${SITE.address.line1} · ${SITE.address.city}, ${SITE.address.state} ${SITE.address.zip}`,
    slot: "EXTERIOR_PHOTO_01",
  });
}
