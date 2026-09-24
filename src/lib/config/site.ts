/**
 * Central business configuration. Everything an owner is likely to change
 * lives here or in src/lib/content/*. Nothing here is legal advice.
 * Square brackets mark facts the owner has not confirmed yet.
 */

import { isPlaceholder } from "@/lib/seo/placeholders";

/** The production origin. Every absolute link, the sitemap, share tags, emails and Stripe redirects use it. */
const CANONICAL_URL = "https://gunspa.com";

export const SITE = {
  name: "The Gun Spa",
  shortName: "Gun Spa",
  domain: "gunspa.com",
  canonicalUrl: CANONICAL_URL,
  tagline: "Ready? Aim. Relax!",
  taglineSecondary: "Precision, at ease.",
  description:
    "A shooting club on Rockaway Blvd, five minutes from the JFK terminals. Twelve 25-yard lanes, two private suites, a simulator for anyone with ID, and a lounge with the line behind glass.",
  timezone: "America/New_York",
  phone: "(718) 000-0000", // TODO(owner): real phone
  email: "desk@gunspa.com", // TODO(owner): real email
  address: {
    line1: "158-12 Rockaway Blvd",
    city: "Jamaica",
    state: "NY",
    zip: "11434",
    neighborhood: "Jamaica, Queens",
    mapsUrl: "https://maps.apple.com/?q=158-12+Rockaway+Blvd,+Jamaica,+NY+11434",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=158-12+Rockaway+Blvd,+Jamaica,+NY+11434",
  },
  social: {
    instagram: "https://instagram.com/thegunspa",
  },
  /**
   * Server-authoritative. Client bundles only see NEXT_PUBLIC_SITE_URL, so in
   * the browser this may read the localhost fallback; nothing on the client
   * reads it today.
   */
  url: resolveSiteUrl({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    REPLIT_DEV_DOMAIN: process.env.REPLIT_DEV_DOMAIN,
    NODE_ENV: process.env.NODE_ENV,
  }),
} as const;

/**
 * The desk phone, or null while site.ts still holds the 000-0000 placeholder.
 * Every "call the desk" line (emails, error pages, the confirmation page, the
 * availability outage state) goes through here, so a fake number never
 * reaches a guest; callers fall back to the desk email or to replying.
 */
export function deskPhone(): string | null {
  return isPlaceholder(SITE.phone) ? null : SITE.phone;
}

/** A tel: link for the desk phone, or null while it is a placeholder. */
export function deskPhoneHref(): string | null {
  const phone = deskPhone();
  return phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
}

/**
 * The public origin. NEXT_PUBLIC_SITE_URL wins when set. Otherwise a
 * production build uses the canonical domain above, and development uses the
 * Replit workspace domain or localhost.
 *
 * The production default is deliberate: Replit's deployment builder does not
 * pass workspace secrets to `next build`, and the sitemap, robots file and
 * Open Graph tags are rendered at build time, so anything read from the
 * environment there (including REPLIT_DOMAINS) bakes a build-host name into
 * the published site. A value typed without a scheme gets https://. Never
 * throws: an unparsable value falls back so a typo in a secret cannot take
 * every page down.
 */
export function resolveSiteUrl(env: Record<string, string | undefined>): string {
  // Anything that is not an explicit dev or test process counts as production, so a builder
  // that leaves NODE_ENV unset or odd still gets the canonical domain.
  const development = env.NODE_ENV === "development" || env.NODE_ENV === "test";
  const fallback = development ? "http://localhost:5000" : CANONICAL_URL;
  const override = publicOrigin(env.NEXT_PUBLIC_SITE_URL);
  if (override) return override;
  if (env.NEXT_PUBLIC_SITE_URL?.trim() && !development) {
    console.error(`[site] NEXT_PUBLIC_SITE_URL is not a public URL: ${JSON.stringify(env.NEXT_PUBLIC_SITE_URL)}; using ${fallback}`);
  }
  return (development && publicOrigin(env.REPLIT_DEV_DOMAIN)) || fallback;
}

/**
 * The origin of a usable public address, or null. The host must be localhost,
 * an IPv4 address, or a real domain whose top-level label is letters only, so
 * a build-host token such as "0hdm0b8.y_" can never end up in the sitemap.
 */
function publicOrigin(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    const host = u.hostname;
    const label = "[a-z0-9](?:[a-z0-9-]*[a-z0-9])?";
    const usable = host === "localhost" || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || new RegExp(`^(?:${label}\\.)+[a-z]{2,}$`, "i").test(host);
    return usable ? u.origin : null;
  } catch {
    return null;
  }
}

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
  sqft: "[11,600]", // building record; owner to confirm the club's footprint
  airChangesPerHour: "[N]",
  /**
   * 158-12 Rockaway Blvd sits on the north edge of JFK, off the Van Wyck.
   * Bracketed values are the owner's to confirm.
   */
  transit: {
    driveFromJfkMin: 5,
    driveFromManhattanMin: "[25]",
    expressway: "Van Wyck Expressway (I-678)",
    exit: "Rockaway Blvd",
    busLine: "[Q7]",
    busWalkMin: "[N]",
    nearestLirr: "Locust Manor",
    lirrDriveMin: "[5]",
    parking: "[On-site parking to be confirmed]",
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
  /** Unpaid Stripe checkouts hold the slot this long (also the Checkout page's lifetime). */
  pendingHoldMin: 30,
  /**
   * The database keeps the hold this much longer than Stripe keeps the Checkout
   * page open, so a payment made in the last seconds (plus webhook latency)
   * always lands on a row that is still pending.
   */
  holdGraceMin: 5,
  /** Guests may cancel free of charge up to this many hours before start (lanes, training, simulator). */
  freeCancelHours: 24,
  /** Suites and events use a longer window. */
  suiteFreeCancelHours: 72,
  minGuests: 1,
  maxGuests: 12,
} as const;
