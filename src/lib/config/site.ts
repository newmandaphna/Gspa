/**
 * Central business configuration. Everything an owner is likely to change
 * lives here or in src/lib/content/*. Nothing here is legal advice.
 * Square brackets mark facts the owner has not confirmed yet.
 */

export const SITE = {
  name: "The Gun Spa",
  shortName: "Gun Spa",
  domain: "thegunspa.com",
  tagline: "Ready? Aim. Relax!",
  taglineSecondary: "Precision, at ease.",
  description:
    "A private shooting club and luxury indoor range in Jamaica, Queens. Twelve acoustic lanes, two private suites, two simulator bays. Three instructors and a lounge worth the trip.",
  timezone: "America/New_York",
  phone: "(718) 000-0000", // TODO(owner): real phone
  email: "desk@thegunspa.com", // TODO(owner): real email
  address: {
    line1: "[Street address]", // TODO(owner): street address
    city: "Jamaica",
    state: "NY",
    zip: "11432", // TODO(owner): confirm ZIP
    neighborhood: "Jamaica, Queens",
    mapsUrl: "https://maps.apple.com/?q=Jamaica+Station+Queens+NY",
  },
  social: {
    instagram: "https://instagram.com/thegunspa",
  },
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5000",
} as const;

/**
 * Physical facts, in one place, so a single edit (say, 16 lanes instead of 12)
 * changes the hero, floor plan, spec chips and copy together.
 */
export const FACILITY = {
  laneCount: 12,
  laneYards: 25,
  suites: 2,
  lanesPerSuite: 2,
  simulatorBays: 2,
  instructors: 3,
  classroomSeats: 12,
  sqft: "[11,000]",
  airChangesPerHour: "[N]",
  transit: {
    lirrFromPennMin: 20,
    airtrainFromJfkMin: 10,
    walkFromLirrMin: "[N]",
    walkFromSubwayMin: "[N]",
  },
} as const;

export type Hours = { open: string; close: string } | null;

/** Opening hours by day of week (0 = Sunday). null = closed. 24h "HH:MM". */
export const HOURS: Record<number, Hours> = {
  0: { open: "09:00", close: "20:00" },
  1: { open: "10:00", close: "22:00" },
  2: { open: "10:00", close: "22:00" },
  3: { open: "10:00", close: "22:00" },
  4: { open: "10:00", close: "22:00" },
  5: { open: "10:00", close: "22:00" },
  6: { open: "09:00", close: "22:00" },
};

export const HOURS_DISPLAY: { days: string; hours: string; dow: number[] }[] = [
  { days: "Monday to Friday", hours: "10 AM to 10 PM", dow: [1, 2, 3, 4, 5] },
  { days: "Saturday", hours: "9 AM to 10 PM", dow: [6] },
  { days: "Sunday", hours: "9 AM to 8 PM", dow: [0] },
];

/**
 * Bookable resources and how many can be in use at once.
 * Experiences reference a resource key; capacity is shared across every
 * experience that uses the same resource (a lane session and a heritage
 * rifle session both consume "lane" units).
 */
export const RESOURCES = {
  lane: { label: "Lane", capacity: 12 },
  suite: { label: "Private Suite", capacity: 2 },
  simulator: { label: "Simulator Bay", capacity: 2 },
  instructor: { label: "Instructor", capacity: 3 },
  classroom: { label: "Classroom Seat", capacity: 12 },
  gunsmith: { label: "Gunsmith Bench", capacity: 1 },
  detailing: { label: "Detailing Bay", capacity: 1 },
} as const;

export type ResourceKey = keyof typeof RESOURCES;

/**
 * Membership tiers, lowest to highest. Keys are stored on members and on
 * experiences (minTier). Display copy lives in src/lib/content/membership.ts.
 */
export const TIERS = ["club", "signature", "founders"] as const;
export type TierKey = (typeof TIERS)[number];

/** How far ahead each tier may reserve. The public window is BOOKING.maxAdvanceDays. */
export const TIER_WINDOW_DAYS: Record<TierKey, number> = {
  club: 14,
  signature: 21,
  founders: 30,
};

export function tierRank(tier: string): number {
  const i = TIERS.indexOf(tier as TierKey);
  return i === -1 ? -1 : i;
}

/** True if `memberTier` satisfies a `minTier` requirement (null = no requirement). */
export function tierSatisfies(memberTier: string, minTier: string | null | undefined): boolean {
  if (!minTier) return true;
  return tierRank(memberTier) >= tierRank(minTier);
}

/** Booking window in days for a tier key (falls back to the public window). */
export function windowDaysFor(tier: string | null | undefined): number {
  return (tier && TIER_WINDOW_DAYS[tier as TierKey]) || BOOKING.maxAdvanceDays;
}

/** Total lockers available for rent (assignment is handled by staff). */
export const LOCKERS_TOTAL = 60;

export const BOOKING = {
  /** Slot boundaries every N minutes. */
  slotStepMin: 30,
  /** Earliest any reservation may start, relative to now. */
  leadTimeMin: 120,
  /** How far ahead the public can book. Members use TIER_WINDOW_DAYS. */
  maxAdvanceDays: 7,
  /** The calendar never opens further than this for anyone. */
  calendarCapDays: 30,
  /** Unpaid Stripe checkouts hold the slot this long. */
  pendingHoldMin: 30,
  /** Guests may cancel free of charge up to this many hours before start (lanes, training, simulator). */
  freeCancelHours: 24,
  /** Suites and events use a longer window. */
  suiteFreeCancelHours: 72,
  minGuests: 1,
  maxGuests: 12,
} as const;
