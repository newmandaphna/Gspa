import type { TierKey } from "@/lib/config/site";

export type Tier = {
  key: TierKey;
  name: string;
  price: string;
  priceNote: string;
  billing: "annual" | "lifetime";
  tagline: string;
  perks: string[];
  guestsPerVisit: number;
  bookingWindowDays: number;
  highlight?: boolean;
  limited?: string;
};

/** Baseline tiers. Prices are placeholders until the owner confirms. */
export const MEMBERSHIP_TIERS: Tier[] = [
  {
    key: "club",
    name: "Club",
    price: "$3,000",
    priceNote: "per year",
    billing: "annual",
    tagline: "Your lane, your lounge, your schedule.",
    perks: [
      "Unlimited lane time, no hourly fees",
      "Book 60 days ahead, public sees 30",
      "One guest per visit at member rates",
      "Lounge, espresso bar and gear check",
      "Member pricing on training and events",
      "Quarterly gunsmith inspection",
    ],
    guestsPerVisit: 1,
    bookingWindowDays: 60,
  },
  {
    key: "signature",
    name: "Signature",
    price: "$7,500",
    priceNote: "per year",
    billing: "annual",
    tagline: "The club, with the doors open.",
    perks: [
      "Everything in Club",
      "Reserve Lanes and simulator bays included",
      "Three guests per visit",
      "Private locker with climate control",
      "Gunsmith bench time and detailing included",
      "Two private suite sessions each month",
      "Priority same-day availability",
    ],
    guestsPerVisit: 3,
    bookingWindowDays: 60,
    highlight: true,
  },
  {
    key: "founders",
    name: "Founders",
    price: "$20,000",
    priceNote: "once, for life",
    billing: "lifetime",
    tagline: "One hundred names. Never more.",
    perks: [
      "Everything in Signature, for life",
      "Founders Suite, reserved for you",
      "Five guests per visit, guest passes on request",
      "Dedicated concierge and instructor",
      "Name engraved on the Founders wall",
      "First access to new lanes, events and gear",
    ],
    guestsPerVisit: 5,
    bookingWindowDays: 90,
    limited: "Limited to 100 memberships",
  },
];

export function tierByKey(key: string): Tier | undefined {
  return MEMBERSHIP_TIERS.find((t) => t.key === key);
}

export type BenefitRow = { label: string; club: string | boolean; signature: string | boolean; founders: string | boolean };

/** Comparison table (true = included, false = not included, string = detail). */
export const BENEFITS: BenefitRow[] = [
  { label: "Lane time", club: "Unlimited", signature: "Unlimited", founders: "Unlimited" },
  { label: "Advance booking window", club: "60 days", signature: "60 days", founders: "90 days" },
  { label: "Guests per visit", club: "1", signature: "3", founders: "5" },
  { label: "Reserve Lanes (50 yd)", club: "Member rate", signature: true, founders: true },
  { label: "Simulator bays", club: "Member rate", signature: true, founders: true },
  { label: "Private suite sessions", club: "Member rate", signature: "2 / month", founders: "Unlimited" },
  { label: "Private locker", club: "Available", signature: true, founders: true },
  { label: "Gunsmith bench time", club: "Quarterly", signature: true, founders: true },
  { label: "Firearm detailing", club: "Member rate", signature: true, founders: true },
  { label: "Private instruction", club: "Member rate", signature: "Member rate", founders: "Included monthly" },
  { label: "Concierge", club: false, signature: "Front desk", founders: "Dedicated" },
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
  { title: "Reserve a lane", description: "Member rates, 60-day window.", href: "/reserve?category=lane", kind: "book" },
  { title: "Book a suite", description: "Private, two hours, up to six.", href: "/reserve?category=suite", kind: "book" },
  { title: "Gunsmith bench", description: "Thirty minutes with the smith.", href: "/reserve?category=service", kind: "book" },
  { title: "Training", description: "Coaching, classes, qualifications.", href: "/reserve?category=training", kind: "book" },
  { title: "Request a locker", description: "Climate-controlled, yours.", href: "/members/requests/new?kind=locker", kind: "request" },
  { title: "Guest passes", description: "Bring someone new.", href: "/members/requests/new?kind=guest_pass", kind: "request" },
  { title: "Firearm storage", description: "Secure, insured, on site.", href: "/members/requests/new?kind=storage", kind: "request", minTier: "signature" },
  { title: "Concierge", description: "Ammo, gear, anything else.", href: "/members/requests/new?kind=general", kind: "request" },
];

export const APPLICATION_STEPS: { title: string; body: string }[] = [
  { title: "Apply", body: "A short application and a conversation with our membership director." },
  { title: "Verification", body: "Every member is vetted, including a comprehensive background check." },
  { title: "Orientation", body: "A private safety orientation and range walkthrough before your first session." },
  { title: "Activate", body: "You receive a member number and an activation code for the members portal." },
];
