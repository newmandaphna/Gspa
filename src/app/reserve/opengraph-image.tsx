import { BOOKING, SITE } from "@/lib/config/site";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/seo/og";

export const alt = `${SITE.name}: reserve a lane, a suite, a simulator bay or an instructor`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Share card for /reserve. The headline matches the page's own h1. */
export default function OpenGraphImage() {
  return ogCard({
    headline: "Pick a lane. Pick a time.",
    fact: `Lanes, suites, simulator bays and a seat with an instructor, ${BOOKING.maxAdvanceDays} days ahead. No account required.`,
    slot: "HERO_PHOTO_01",
  });
}
