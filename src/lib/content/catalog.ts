import type { ResourceKey, TierKey } from "@/lib/config/site";

export type Category = "lane" | "suite" | "training" | "experience" | "service" | "event";

export type CatalogItem = {
  slug: string;
  name: string;
  category: Category;
  resource: ResourceKey;
  durationMin: number;
  /** Price per unit (one lane, one suite, one seat) in cents. */
  priceCents: number;
  maxGuestsPerUnit: number;
  maxUnitsPerBooking: number;
  tagline: string;
  description: string;
  includes: string[];
  /** false = inquiry only (no calendar). */
  bookable: boolean;
  /** Only visible and bookable to signed-in members. */
  memberOnly?: boolean;
  /** Member price per unit in cents (undefined = same as public). */
  memberPriceCents?: number;
  /** Minimum tier required to book. */
  minTier?: TierKey;
};

// Placeholder — replaced by the final spec.
export const CATALOG: CatalogItem[] = [
  {
    slug: "signature-lane",
    name: "Signature Lane",
    category: "lane",
    resource: "lane",
    durationMin: 60,
    priceCents: 9500,
    memberPriceCents: 6500,
    maxGuestsPerUnit: 2,
    maxUnitsPerBooking: 4,
    tagline: "One hour. One lane. Nothing between you and the target.",
    description: "A 25-yard climate-controlled lane with programmable target carrier, eye and ear protection, and a range safety officer on the floor.",
    includes: ["25-yard lane", "Programmable carrier", "Eye and ear protection", "RSO on the floor"],
    bookable: true,
  },
  {
    slug: "gunsmith-bench",
    name: "Gunsmith Bench Time",
    category: "service",
    resource: "gunsmith",
    durationMin: 30,
    priceCents: 7500,
    memberPriceCents: 0,
    maxGuestsPerUnit: 1,
    maxUnitsPerBooking: 1,
    tagline: "Thirty minutes with our gunsmith.",
    description: "Sight-in, trigger work, cleaning and inspection.",
    includes: ["Certified gunsmith", "Bench and tools"],
    bookable: true,
    memberOnly: true,
  },
  {
    slug: "founders-suite",
    name: "Founders Suite",
    category: "suite",
    resource: "suite",
    durationMin: 120,
    priceCents: 0,
    maxGuestsPerUnit: 6,
    maxUnitsPerBooking: 1,
    tagline: "The suite, for Founders.",
    description: "Two hours in a private suite.",
    includes: ["Private suite"],
    bookable: true,
    memberOnly: true,
    minTier: "founders",
  },
];

export const CATEGORY_LABELS: Record<Category, string> = {
  lane: "Lanes",
  suite: "Private Suites",
  training: "Training",
  experience: "Experiences",
  service: "Member Services",
  event: "Events",
};

/** Public catalog (what a signed-out visitor can browse and book). */
export function publicCatalog(): CatalogItem[] {
  return CATALOG.filter((c) => !c.memberOnly);
}

/** Everything a member of `tier` may book, including member-only items. */
export function memberCatalog(tier: string): CatalogItem[] {
  return CATALOG.filter((c) => !c.minTier || tierRankOf(tier) >= tierRankOf(c.minTier));
}

function tierRankOf(t: string): number {
  return ["club", "signature", "founders"].indexOf(t);
}
