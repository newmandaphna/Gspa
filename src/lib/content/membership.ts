import { TIER_WINDOW_DAYS, type TierKey } from "@/lib/config/site";

export type Tier = {
  key: TierKey;
  name: string;
  /** Headline price, e.g. "$3,600". */
  price: string;
  priceNote: string;
  /** Optional second way to pay (monthly or lifetime). */
  altPrice?: string;
  billing: "annual" | "lifetime" | "annual-or-lifetime";
  tagline: string;
  perks: string[];
  guestsPerVisit: number;
  bookingWindowDays: number;
  highlight?: boolean;
  limited?: string;
  screeningFeeWaived?: boolean;
};

/** One fee, one place. Club and Signature pay it at application; refunded if declined. */
export const SCREENING_FEE_CENTS = 15000;

/** Prices are placeholders until the owner confirms. Bracketed values are unconfirmed. */
export const MEMBERSHIP_TIERS: Tier[] = [
  {
    key: "club",
    name: "Club",
    price: "$3,600",
    priceNote: "per year",
    altPrice: "or $325 a month",
    billing: "annual",
    tagline: "The calendar, a week early.",
    perks: [
      `Reserve ${TIER_WINDOW_DAYS.club} days ahead`,
      "Lane sessions at the member rate of $45",
      "One guest per visit at the member rate",
      "Gear locker, half size",
      "Lounge and espresso bar on every visit, with towel service",
      "Gunsmith bench time included",
      "10% off training and the simulator",
      "Member evenings and competitions",
    ],
    guestsPerVisit: 1,
    bookingWindowDays: TIER_WINDOW_DAYS.club,
  },
  {
    key: "signature",
    name: "Signature",
    price: "$9,000",
    priceNote: "per year",
    billing: "annual",
    tagline: "Two dozen hours and a suite a month.",
    perks: [
      `Reserve ${TIER_WINDOW_DAYS.signature} days ahead`,
      "24 lane hours a year included, then $45",
      "One Private Suite session each month",
      "Two guests per visit at the member rate",
      "Priority instructor scheduling",
      "Full-size biometric locker",
      "Firearm detailing included",
      "Training and the simulator at 20% off, events too",
    ],
    guestsPerVisit: 2,
    bookingWindowDays: TIER_WINDOW_DAYS.signature,
    highlight: true,
  },
  {
    key: "founders",
    name: "Founders",
    price: "$20,000",
    priceNote: "per year",
    altPrice: "or [$60,000] once, for life",
    billing: "annual-or-lifetime",
    tagline: "Fifty names, first call on everything.",
    perks: [
      `Reserve ${TIER_WINDOW_DAYS.founders} days ahead, with same-day priority on two lanes until 6 PM`,
      "Unlimited lane sessions",
      "One Private Suite session each month, and the Founders' Suite at the member rate",
      "Three guests per visit, plus six transferable guest passes a year",
      "Four hours of private instruction a year included",
      "A host on every visit and concierge reservations by text",
      "One private event each year",
      "Name on the Founders wall",
    ],
    guestsPerVisit: 3,
    bookingWindowDays: TIER_WINDOW_DAYS.founders,
    limited: "Limited to 50 memberships",
    screeningFeeWaived: true,
  },
];

export const FOUNDERS_CAP = 50;
/** Editable until the admin tracks it. */
export const FOUNDERS_REMAINING = "[N]";

export function tierByKey(key: string): Tier | undefined {
  return MEMBERSHIP_TIERS.find((t) => t.key === key);
}

export type BenefitRow = { label: string; club: string | boolean; signature: string | boolean; founders: string | boolean };

/** Comparison table (true = included, false = not included, string = detail). Public column is implied by copy. */
export const BENEFITS: BenefitRow[] = [
  { label: "Booking window", club: `${TIER_WINDOW_DAYS.club} days`, signature: `${TIER_WINDOW_DAYS.signature} days`, founders: `${TIER_WINDOW_DAYS.founders} days` },
  { label: "Same-day priority", club: false, signature: false, founders: "Two lanes until 6 PM" },
  { label: "Guests per visit", club: "1", signature: "2", founders: "3" },
  { label: "Guest passes per year", club: false, signature: false, founders: "6, transferable" },
  { label: "Lane rate", club: "$45", signature: "$45 after 24 hours", founders: "Included" },
  { label: "Included lane hours", club: false, signature: "24 a year", founders: "Unlimited" },
  { label: "Private Suite sessions", club: "Member rate", signature: "1 a month", founders: "1 a month" },
  { label: "Founders' Suite", club: "Public rate", signature: "Public rate", founders: "Member rate" },
  { label: "Locker", club: "Half size", signature: "Full size, biometric", founders: "Full size, biometric" },
  { label: "Gunsmith bench time", club: true, signature: true, founders: true },
  { label: "Firearm detailing", club: "Member rate", signature: true, founders: true },
  { label: "Training and simulator", club: "10% off", signature: "20% off", founders: "20% off, 4 hrs instruction included" },
  { label: "Private event", club: false, signature: false, founders: "1 a year" },
  { label: "Founders wall", club: false, signature: false, founders: true },
];

export type MemberService = {
  title: string;
  description: string;
  href: string;
  kind: "book" | "request";
  minTier?: TierKey;
};

/** Quick actions on the member dashboard. */
export const MEMBER_SERVICES: MemberService[] = [
  { title: "Reserve a lane", description: "Member rate, your window.", href: "/reserve?category=lane", kind: "book" },
  { title: "Reserve a suite", description: "Two lanes behind a closed door.", href: "/reserve?category=suite", kind: "book" },
  { title: "Gunsmith bench", description: "Thirty minutes with the smith.", href: "/reserve?experience=gunsmith-bench", kind: "book" },
  { title: "Firearm detailing", description: "Cleaned, back the same day.", href: "/reserve?experience=firearm-detailing", kind: "book", minTier: "signature" },
  { title: "Training", description: "Instruction, or the course.", href: "/reserve?category=training", kind: "book" },
  { title: "Request a locker", description: "Gear only. Fingerprint or PIN.", href: "/members/requests/new?kind=locker", kind: "request" },
  { title: "Guest passes", description: "Bring someone new.", href: "/members/requests/new?kind=guest_pass", kind: "request" },
  { title: "Concierge", description: "Ammunition, gear, anything else.", href: "/members/requests/new?kind=general", kind: "request" },
];

export const APPLICATION_STEPS: { title: string; body: string; when: string }[] = [
  { title: "Apply", body: "Ten minutes online: name, contact, tier, license status, two references.", when: "Day 0" },
  { title: "ID and license check", body: "We check your ID and licensing status.", when: "Day 1 to 2" },
  { title: "Background screen", body: "A third party runs it, with your written authorization, as the law requires.", when: "Day 3 to 8" },
  { title: "Orientation", body: "Twenty minutes in person: safety briefing and a walkthrough.", when: "Day 9 to 10" },
  { title: "Activate", body: "You get a member number and an activation code for the members portal.", when: "Day 10" },
];
