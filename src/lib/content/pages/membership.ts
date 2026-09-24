/**
 * Copy for /membership. Edit words here; the page renders from these constants.
 * Tier facts (prices, windows, guests, perks, the screening fee, the Founders
 * cap) come from src/lib/content/membership.ts and src/lib/config/site.ts so
 * one edit there changes the cards, the strips, the table and the copy together.
 * Square brackets are the owner's placeholders and stay until confirmed.
 */
import { BOOKING, TIER_WINDOW_DAYS } from "@/lib/config/site";
import {
  APPLICATION_STEPS,
  BENEFITS,
  FOUNDERS_CAP,
  FOUNDERS_FIRST_ON_WALL,
  MEMBERSHIP_TIERS,
  MEMBER_SERVICES,
  SCREENING_FEE_CENTS,
  type BenefitRow,
  type Tier,
} from "@/lib/content/membership";
import { formatMoney } from "@/lib/time";

export type Cta = { label: string; href: string };

export type SectionCopy = {
  eyebrow?: string;
  headline: string;
  subhead: string;
  body: string;
  cta?: Cta;
  secondary?: Cta;
};

/* ------------------------------------------------------------- helpers */

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** Numbers spelled out for running copy (voice rule). Display numerals stay numerals. */
export function numberWord(n: number): string {
  if (n < 20) return ONES[n] ?? String(n);
  if (n < 100) {
    const t = TENS[Math.floor(n / 10)];
    const o = n % 10;
    return o ? `${t}-${ONES[o]}` : t;
  }
  return String(n);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Club and Signature", "Club, Signature and Founders". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function tier(key: Tier["key"]): Tier {
  const found = MEMBERSHIP_TIERS.find((t) => t.key === key);
  if (!found) throw new Error(`Membership tier missing: ${key}`);
  return found;
}

export const FOUNDERS_TIER = tier("founders");
export const HIGHLIGHT_TIER = MEMBERSHIP_TIERS.find((t) => t.highlight) ?? tier("signature");
export const TIER_NAMES = MEMBERSHIP_TIERS.map((t) => t.name);

export const REQUIREMENTS_LINK: Cta = { label: "See requirements", href: "/visit#requirements" };

export const MEMBERSHIP_META = {
  title: "Membership",
  description: `Three tiers. Members reserve ${TIER_WINDOW_DAYS.club}, ${TIER_WINDOW_DAYS.signature} or ${TIER_WINDOW_DAYS.founders} days ahead, shoot at the member rate and sign guests in on their own name. Founders stops at ${FOUNDERS_CAP} memberships.`,
};

/* ---------------------------------------------------------------- hero */

export const MEMBERSHIP_HERO: SectionCopy = {
  eyebrow: "Membership",
  headline: "This is a members' club.",
  subhead: "Three tiers, vetted to the same standard.",
  body: "Members see the calendar before the public does, sign guests in on their own name and keep a locker here.",
  cta: { label: "Apply", href: "#apply" },
  secondary: { label: "Compare tiers", href: "#tiers" },
};

export const HERO_SIGN_IN = { prefix: "Already a member?", label: "Sign in", href: "/members/login" };

/**
 * The page opens on the wall, not the grid: a dark band composed on the
 * member card or key tag photograph (MEMBER_CARD_01). Until that photo
 * exists the band is plain black with the headline alone.
 */
export const MEMBERSHIP_OPENING = {
  headline: `${cap(numberWord(FOUNDERS_CAP))} Founders.`,
  /** Mono running head: facts, not a label. */
  runningHead: `${FOUNDERS_CAP} plates · ${TIER_WINDOW_DAYS.club}, ${TIER_WINDOW_DAYS.signature} or ${TIER_WINDOW_DAYS.founders} days ahead · one screen for every tier`,
  body: `Three tiers. Members see the calendar ${TIER_WINDOW_DAYS.club}, ${TIER_WINDOW_DAYS.signature} or ${TIER_WINDOW_DAYS.founders} days ahead while the public sees ${numberWord(BOOKING.maxAdvanceDays)}, sign guests in on their own name and keep a locker here. ${cap(numberWord(FOUNDERS_CAP))} of them get a plate on the wall.`,
  cta: { label: "See the tiers", href: "#tiers" } satisfies Cta,
  secondary: { label: "Request a conversation", href: "#founders-request" } satisfies Cta,
  photoAlt: "A Gun Spa member card on the desk, the number engraved, lane light behind it",
};

/* --------------------------------------------------------------- tiers */

/** Rendered from the fee and each tier's flag, never typed. */
export const SCREENING_FEE_SENTENCE = (() => {
  const paying = MEMBERSHIP_TIERS.filter((t) => !t.screeningFeeWaived).map((t) => t.name);
  const waived = MEMBERSHIP_TIERS.filter((t) => t.screeningFeeWaived).map((t) => t.name);
  // No timing here: the Apply section says when it is collected, and that changes when online payment goes live.
  const first = `${joinNames(paying)} pay a ${formatMoney(SCREENING_FEE_CENTS)} screening fee, refunded if we decline you.`;
  return waived.length ? `${first} ${joinNames(waived)} skip it.` : first;
})();

export const MEMBERSHIP_TIERS_COPY: SectionCopy = {
  eyebrow: "Tiers",
  headline: `${TIER_NAMES.join(". ")}.`,
  subhead: `${TIER_WINDOW_DAYS.club}, ${TIER_WINDOW_DAYS.signature} or ${TIER_WINDOW_DAYS.founders} days ahead, one screening standard for all of them.`,
  body: `Prices are per year. Club can be billed monthly if you prefer. ${SCREENING_FEE_SENTENCE}`,
};

export const TIER_CARD = {
  windowUnit: "days ahead",
  mostChosen: "Most chosen",
  cta: { label: "Apply", href: "#apply" } satisfies Cta,
  /** Founders does not go through the form; the desk calls. */
  foundersCta: { label: "Request a conversation", href: "#founders-request" } satisfies Cta,
};

/** The full grid sits inside a closed <details>; this is its summary line. */
export const COMPARE_DETAILS = { summary: "Every line", hint: `${BENEFITS.length + 1} rows, all three tiers` };

/** Compare table: the benefits list plus the fee row, then a requirements link. */
export const COMPARE_ROWS: BenefitRow[] = [
  ...BENEFITS,
  {
    label: "Screening fee",
    club: tier("club").screeningFeeWaived ? "Waived" : `${formatMoney(SCREENING_FEE_CENTS)}, refundable`,
    signature: tier("signature").screeningFeeWaived ? "Waived" : `${formatMoney(SCREENING_FEE_CENTS)}, refundable`,
    founders: tier("founders").screeningFeeWaived ? "Waived" : `${formatMoney(SCREENING_FEE_CENTS)}, refundable`,
  },
];

export const COMPARE_CAPTION = `Everything each tier includes. For reference, the public reserves ${numberWord(BOOKING.maxAdvanceDays)} days ahead.`;

/* ------------------------------------------------------------- windows */

export type WindowStrip = { key: string; label: string; days: number };

export const WINDOW_STRIPS: WindowStrip[] = [
  { key: "public", label: "Public", days: BOOKING.maxAdvanceDays },
  ...MEMBERSHIP_TIERS.map((t) => ({ key: t.key, label: t.name, days: t.bookingWindowDays })),
];

export const MEMBERSHIP_WINDOWS: SectionCopy = {
  eyebrow: "Reservation windows",
  headline: "Reserve before the public.",
  subhead: `${cap(joinNames(MEMBERSHIP_TIERS.map((t) => numberWord(t.bookingWindowDays))).replace(" and ", ", or "))} days ahead.`,
  body: `The public sees ${numberWord(BOOKING.maxAdvanceDays)} days. Founders also hold two lanes on same-day priority until 6 PM, the closest thing here to walking in.`,
};

/* -------------------------------------------------------------- guests */

export type GuestOption = { key: Tier["key"]; label: string; guests: number };

export const GUEST_OPTIONS: GuestOption[] = MEMBERSHIP_TIERS.map((t) => ({ key: t.key, label: t.name, guests: t.guestsPerVisit }));
export const GUEST_MAX = Math.max(...GUEST_OPTIONS.map((g) => g.guests));

export const MEMBERSHIP_GUESTS: SectionCopy = {
  eyebrow: "Guests",
  headline: "Your guests, on your membership",
  subhead: `${cap(GUEST_OPTIONS.map((g) => `${numberWord(g.guests)} at ${g.label}`).join(", "))}, every one of them under your name.`,
  body: `Each guest signs the acknowledgement on their phone before the visit and meets the same requirements as anyone else in that session. Bring up to ${numberWord(GUEST_MAX)}, depending on your tier. On the line, what they do is on you.`,
  cta: REQUIREMENTS_LINK,
};

export const GUEST_NOTE = "A guest gets six visits a year. The seventh is an application.";
export const GUEST_PICKER_LABELS = { you: "You", guest: "Guest", legend: "Guests per visit" };

/* ------------------------------------------------------------- vetting */

export const MEMBERSHIP_VETTING: SectionCopy = {
  eyebrow: "Vetting",
  headline: "Who shoots next to you?",
  subhead: `${cap(numberWord(APPLICATION_STEPS.length))} steps over about ten business days.`,
  body: "Apply online. We check ID and license status, then a third party runs a background screen with your written authorization. You come in for a 20-minute orientation. Then you are active. Nobody skips a step.",
};

export const VETTING_STEPS = APPLICATION_STEPS;
export const VETTING_VENDOR_LINE = "Screening by [Vendor].";
export const VETTING_LINK: Cta = { label: "How screening works", href: "/legal#screening" };

export const PORTAL_UNLOCKS = {
  eyebrow: "Members portal",
  headline: "Once you are active.",
  minTierNote: (name: string) => `${name} and up`,
  services: MEMBER_SERVICES,
};

/* ------------------------------------------------------------ founders */

export const MEMBERSHIP_FOUNDERS: SectionCopy = {
  eyebrow: FOUNDERS_TIER.limited ?? `Limited to ${FOUNDERS_CAP} memberships`,
  headline: `${cap(numberWord(FOUNDERS_CAP))} Founders.`,
  subhead: "Your name on the wall and first call on everything.",
  body: `A ${TIER_WINDOW_DAYS.founders}-day window, same-day priority on two lanes, ${numberWord(FOUNDERS_TIER.guestsPerVisit)} guests, unlimited lane time, a suite session every month, a host on every visit. Once all ${numberWord(FOUNDERS_CAP)} names are up, the list is closed for good.`,
  cta: { label: "Request a conversation", href: "#founders-request" },
};

export const FOUNDERS_PRICE_LINE = `${FOUNDERS_TIER.price} ${FOUNDERS_TIER.priceNote}${FOUNDERS_TIER.altPrice ? `, ${FOUNDERS_TIER.altPrice}` : ""}.`;
export const FOUNDERS_WALL_ALT = "The Founders wall at The Gun Spa: fifty engraved nameplates, most still blank";

/**
 * The wall band. The count is live: FOUNDERS_CAP minus the members on the
 * founders tier who are active or pending. At the cap the band flips to a
 * waitlist and the form changes its first line.
 */
export const FOUNDERS_WALL = {
  runningHead: `${FOUNDERS_CAP} plates · one wall · live count`,
  /** Under the display numeral. */
  remainingLabel: (remaining: number) => (remaining === 1 ? "plate left" : "plates left"),
  namesUp: (taken: number) => (taken === 0 ? "No names up yet." : taken === 1 ? "One name is up." : `${cap(numberWord(taken))} names are up.`),
  firstOnWall: FOUNDERS_FIRST_ON_WALL ? `The first name on the wall is ${FOUNDERS_FIRST_ON_WALL}, who shot here before there was a sign.` : null,
  full: {
    headline: "The wall is full.",
    subhead: `All ${numberWord(FOUNDERS_CAP)} names are up.`,
    body: "Leave your name and the desk calls you if a plate opens, in the order the names came in.",
  },
} as const;

/* ---------------------------------------------------- founders request */

export const BEST_TIME_OPTIONS = ["Mornings", "Afternoons", "Evenings", "Weekends"] as const;
export type BestTime = (typeof BEST_TIME_OPTIONS)[number];

/**
 * "Request a conversation": name, phone, best time, who referred you. Posts
 * to /api/inquiries with kind "founders". The desk calls back within one
 * business day; the wall opt-in travels in the message text.
 */
export const FOUNDERS_REQUEST = {
  title: "Request a conversation",
  titleWaitlist: "Join the waitlist",
  lede: "Founders does not go through the form. Leave a number and someone from the desk calls you within one business day.",
  ledeWaitlist: "Leave a number. If a plate opens, the desk calls the list in order.",
  labels: {
    name: "Full name",
    phone: "Phone",
    email: "Email",
    bestTime: "Best time to call",
    referrer: "Who referred you",
    referrerHint: "A member's name, or leave it blank.",
    wallOptIn: "Show my first name and last initial on the wall art here, once my plate is up.",
    submit: "Request a call",
    submitWaitlist: "Join the waitlist",
    sending: "Sending",
  },
  messageKeys: {
    request: "Request",
    bestTime: "Best time",
    referrer: "Referred by",
    wall: "Wall listing",
  },
  messageValues: {
    conversation: "Founders conversation, call back within one business day",
    waitlist: "Founders waitlist",
    wallYes: "yes, first name and last initial",
    wallNo: "no",
    unspecified: "not said",
  },
  success: {
    line: "Thank you. The desk has your number.",
    lineWaitlist: "You are on the list.",
    reference: "Reference",
  },
  errors: {
    name: "Please tell us your name.",
    phone: "We call you back, so we need a number.",
    email: "Enter a valid email.",
    generic: "Could not send that. Please call the desk directly.",
  },
} as const;

/* --------------------------------------------------------------- apply */

export const MEMBERSHIP_APPLY: SectionCopy = {
  eyebrow: "Application",
  headline: "Ten minutes now, then a member number in about ten business days.",
  subhead: "",
  body: "Name, contact, tier, license status, two references. Until online payment goes live, we collect the screening fee at orientation.",
};

export const LICENSE_OPTIONS = ["None", "Premises", "Carry"] as const;
export type LicenseOption = (typeof LICENSE_OPTIONS)[number];

export const HEARD_OPTIONS = ["A member", "Instagram", "Search", "Press", "An event here", "Other"] as const;

export const APPLY_FORM = {
  labels: {
    name: "Full name",
    email: "Email",
    phone: "Phone",
    tier: "Tier",
    license: "NYC pistol license",
    reference1: "Reference one",
    reference2: "Reference two",
    referenceHint: "Name and how to reach them. Each reference gets one question by email.",
    heard: "How you heard about us",
    consentPrefix: "I understand membership includes a third-party background screen that I authorize separately, and I have read the",
    consentScreening: "screening notice",
    consentAnd: "and the",
    consentPrivacy: "privacy policy",
    consentSuffix: ".",
    submit: "Send application",
    sending: "Sending",
  },
  links: { screening: "/legal#screening", privacy: "/legal#privacy" },
  stripe: {
    label: "Screening fee",
    waived: (tierName: string) => `No screening fee for ${tierName}.`,
    due: `${formatMoney(SCREENING_FEE_CENTS)} screening fee, collected at orientation. Refunded if declined.`,
  },
  success: {
    line: "Thank you. Your application is with the desk.",
    reference: "Reference",
  },
  errors: {
    consent: "Please confirm you have read the screening notice and privacy policy.",
    generic: "Could not send your application. Please email the desk directly.",
  },
} as const;
