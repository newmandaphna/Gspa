/**
 * Central business configuration. Everything an owner is likely to change
 * lives here or in src/lib/content/*. Nothing here is legal advice.
 */

export const SITE = {
  name: "The Gun Spa",
  shortName: "Gun Spa",
  domain: "thegunspa.com",
  tagline: "Precision, refined.",
  description:
    "A private shooting club and luxury indoor range in Jamaica, Queens. Sixteen lanes, private suites, world-class instruction, and a lounge worth the trip.",
  timezone: "America/New_York",
  phone: "(718) 000-0000", // TODO(owner): real phone
  email: "hello@thegunspa.com", // TODO(owner): real email
  address: {
    line1: "Address to be announced", // TODO(owner): street address
    city: "Jamaica",
    state: "NY",
    zip: "11432",
    neighborhood: "Jamaica, Queens",
  },
  social: {
    instagram: "https://instagram.com/thegunspa",
  },
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5000",
} as const;

export type Hours = { open: string; close: string } | null;

/** Opening hours by day of week (0 = Sunday). null = closed. 24h "HH:MM". */
export const HOURS: Record<number, Hours> = {
  0: { open: "09:00", close: "21:00" },
  1: { open: "11:00", close: "22:00" },
  2: { open: "11:00", close: "22:00" },
  3: { open: "11:00", close: "22:00" },
  4: { open: "11:00", close: "23:00" },
  5: { open: "11:00", close: "23:00" },
  6: { open: "09:00", close: "23:00" },
};

export const HOURS_DISPLAY: { days: string; hours: string }[] = [
  { days: "Monday – Wednesday", hours: "11 AM – 10 PM" },
  { days: "Thursday – Friday", hours: "11 AM – 11 PM" },
  { days: "Saturday", hours: "9 AM – 11 PM" },
  { days: "Sunday", hours: "9 AM – 9 PM" },
];

/**
 * Bookable resources and how many can be in use at once.
 * Experiences reference a resource key; capacity is shared across every
 * experience that uses the same resource (a 1-hour and a 2-hour lane session
 * both consume "lane" units).
 */
export const RESOURCES = {
  lane: { label: "Signature Lane", capacity: 12 },
  premiumLane: { label: "Reserve Lane", capacity: 4 },
  suite: { label: "Private Suite", capacity: 2 },
  simulator: { label: "Simulator Bay", capacity: 2 },
  instructor: { label: "Instructor", capacity: 3 },
  classroom: { label: "Classroom Seat", capacity: 10 },
  gunsmith: { label: "Gunsmith Bench", capacity: 1 },
  detailing: { label: "Detailing Bay", capacity: 2 },
} as const;

export type ResourceKey = keyof typeof RESOURCES;

/**
 * Membership tiers, lowest to highest. Keys are stored on members and on
 * experiences (minTier). Display copy lives in src/lib/content/membership.ts.
 */
export const TIERS = ["club", "signature", "founders"] as const;
export type TierKey = (typeof TIERS)[number];

export function tierRank(tier: string): number {
  const i = TIERS.indexOf(tier as TierKey);
  return i === -1 ? -1 : i;
}

/** True if `memberTier` satisfies a `minTier` requirement (null = no requirement). */
export function tierSatisfies(memberTier: string, minTier: string | null | undefined): boolean {
  if (!minTier) return true;
  return tierRank(memberTier) >= tierRank(minTier);
}

/** Total lockers available for rent (assignment is handled by staff). */
export const LOCKERS_TOTAL = 60;

export const BOOKING = {
  /** Slot boundaries every N minutes. */
  slotStepMin: 30,
  /** Earliest a public reservation may start, relative to now. */
  leadTimeMin: 60,
  /** How far ahead the public can book. */
  maxAdvanceDays: 30,
  /** Members (with a valid member number) may book further out. */
  memberMaxAdvanceDays: 60,
  /** Unpaid Stripe checkouts hold the slot this long. */
  pendingHoldMin: 30,
  /** Guests may cancel free of charge up to this many hours before start. */
  freeCancelHours: 24,
  minGuests: 1,
  maxGuests: 12,
} as const;
