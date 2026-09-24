/**
 * Copy for /events. Edit words here; the page renders from these constants.
 * Capacities, durations and prices come from the catalog, lane counts from
 * FACILITY, so a single edit there changes the numerals, glyphs and copy
 * together. Square brackets are the owner's placeholders and stay until
 * confirmed.
 */
import { FACILITY, SITE } from "@/lib/config/site";
import { itemBySlug, type CatalogItem } from "@/lib/content/catalog";
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

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** Numbers under 100 spelled out for running copy (voice rule), so a range like "twelve to forty" keeps one style. Display numerals stay numerals. */
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

function item(slug: string): CatalogItem {
  const found = itemBySlug(slug);
  if (!found) throw new Error(`Catalog item missing: ${slug}`);
  return found;
}

/* --------------------------------------------------------------- catalog */

export const PRIVATE_SUITE = item("private-suite");
export const FOUNDERS_SUITE = item("founders-suite");
export const CORPORATE = item("corporate-event");
export const DATE_NIGHT = item("date-night");

/** Smallest group the desk quotes as an event. The catalog copy says "twelve to forty". */
export const CORPORATE_MIN_GUESTS = 12;

/** Range officers: one per this many shooters. Matches the catalog's event copy. */
export const SHOOTERS_PER_OFFICER = 6;

export const REQUIREMENTS_LINK: Cta = { label: "See requirements", href: "/visit#requirements" };

/** "2 hr" for tabular chips. */
export function durationLabel(min: number): string {
  return min % 60 === 0 ? `${min / 60} hr` : `${min} min`;
}

/** Price chip: quoted items have no price in the catalog. */
export function priceLabel(c: CatalogItem): string {
  return c.priceCents > 0 ? formatMoney(c.priceCents) : "Quoted";
}

/* ------------------------------------------------------------------ meta */

export const EVENTS_META = {
  title: "Events",
  description: `Events at ${SITE.name} in Jamaica, Queens: a Private Suite for ${numberWord(PRIVATE_SUITE.maxGuestsPerUnit)}, the Founders' Suite for ${numberWord(FOUNDERS_SUITE.maxGuestsPerUnit)}, or the whole floor for ${CORPORATE.maxGuestsPerUnit}. Suites reserve online. Buyouts are quoted within one business day.`,
};

/* ------------------------------------------------------------------ hero */

export const EVENTS_HERO: SectionCopy = {
  eyebrow: "Events",
  headline: "Room for the whole group.",
  subhead: `A Private Suite for ${numberWord(PRIVATE_SUITE.maxGuestsPerUnit)}, the Founders' Suite for ${numberWord(FOUNDERS_SUITE.maxGuestsPerUnit)}, or the whole floor for ${numberWord(CORPORATE.maxGuestsPerUnit)}.`,
  body: "Simulator bays for every guest, lanes for the ones who qualify. The desk checks eligibility. You handle the invitations.",
  cta: { label: "Plan an event", href: "#inquire" },
  secondary: REQUIREMENTS_LINK,
};

export const HERO_NUMERALS: { value: number; label: string }[] = [
  { value: PRIVATE_SUITE.maxGuestsPerUnit, label: "Suite" },
  { value: FOUNDERS_SUITE.maxGuestsPerUnit, label: "Founders' Suite" },
  { value: CORPORATE.maxGuestsPerUnit, label: "Buyout" },
];

export const EVENTS_PHOTO_ALT = "The range floor from above at night: twelve lanes, the two private suites lit, the lounge beyond the glass.";

export const FLOOR_PLAN_LABELS = {
  targetLine: `Target line · ${FACILITY.laneYards} yd`,
  firingLine: "Firing line",
  lounge: "Lounge",
  desk: "Desk",
  suite: (n: number) => `Suite ${String.fromCharCode(64 + n)}`,
};

/* --------------------------------------------------------------- formats */

export const EVENTS_FORMATS: SectionCopy = {
  eyebrow: "Formats",
  headline: `${cap(numberWord(PRIVATE_SUITE.maxGuestsPerUnit))}, ${numberWord(FOUNDERS_SUITE.maxGuestsPerUnit)}, or the whole floor`,
  subhead: "Suites reserve online. Buyouts start with the form below.",
  body: `The Private Suite for ${numberWord(PRIVATE_SUITE.maxGuestsPerUnit)} and the Founders' Suite for ${numberWord(FOUNDERS_SUITE.maxGuestsPerUnit)} reserve on the Reserve page. The whole floor, ${numberWord(CORPORATE.maxGuestsPerUnit)} guests, is quoted per group.`,
  cta: { label: "Reserve a suite", href: "/reserve?category=suite" },
};

export type FormatCard = {
  item: CatalogItem;
  /** Lanes shown in the plan glyph. */
  lanes: number;
  duration: string;
  price: string;
  cta: Cta;
};

export const FORMAT_CARDS: FormatCard[] = [
  {
    item: PRIVATE_SUITE,
    lanes: FACILITY.lanesPerSuite,
    duration: durationLabel(PRIVATE_SUITE.durationMin),
    price: priceLabel(PRIVATE_SUITE),
    cta: { label: "Reserve", href: `/reserve?experience=${PRIVATE_SUITE.slug}` },
  },
  {
    item: FOUNDERS_SUITE,
    lanes: FACILITY.lanesPerSuite * FACILITY.suites,
    duration: durationLabel(FOUNDERS_SUITE.durationMin),
    price: priceLabel(FOUNDERS_SUITE),
    cta: { label: "Reserve", href: `/reserve?experience=${FOUNDERS_SUITE.slug}` },
  },
  {
    item: CORPORATE,
    lanes: FACILITY.laneCount,
    duration: durationLabel(CORPORATE.durationMin),
    price: priceLabel(CORPORATE),
    cta: { label: "Inquire", href: "#inquire" },
  },
];

export const FORMAT_LABELS = {
  guests: "guests",
  lanes: (n: number) => `${n} lanes`,
  from: "from",
};

/* ------------------------------------------------------------ date night */

export const EVENTS_DATE_NIGHT: SectionCopy = {
  eyebrow: "Coming",
  headline: `${DATE_NIGHT.name}.`,
  subhead: DATE_NIGHT.tagline,
  body: "Forty minutes in the simulator, forty on a house rifle with an instructor beside you, and the last forty at a lounge table with dessert and espresso. Priced for two. [Opening date to be confirmed.]",
  cta: { label: "Join the list", href: "#inquire" },
  secondary: REQUIREMENTS_LINK,
};

export const DATE_NIGHT_CHIPS: string[] = [`${priceLabel(DATE_NIGHT)} for two`, durationLabel(DATE_NIGHT.durationMin)];

export const DATE_PHOTO_ALT = "A lounge table set for two with espresso and dessert, the simulator wall glowing beyond the glass.";

/* --------------------------------------------------------------- parties */

export const EVENTS_PARTIES: SectionCopy = {
  eyebrow: "Parties",
  headline: "Throw the party here.",
  subhead: `${cap(numberWord(PRIVATE_SUITE.maxGuestsPerUnit))} in a Private Suite or ${numberWord(FOUNDERS_SUITE.maxGuestsPerUnit)} in the Founders' Suite, with one range officer for every ${numberWord(SHOOTERS_PER_OFFICER)} shooters.`,
  body: "The simulator takes everyone; the lanes take guests who qualify. A member host or a club host is required. No alcohol.",
  cta: { label: "Check suite dates", href: "/reserve?category=suite" },
  secondary: REQUIREMENTS_LINK,
};

export const AVATARS = {
  total: 12,
  gold: SHOOTERS_PER_OFFICER,
  caption: `one range officer per ${numberWord(SHOOTERS_PER_OFFICER)}`,
};

/* ------------------------------------------------------------- corporate */

export const EVENTS_CORPORATE: SectionCopy = {
  eyebrow: "Corporate",
  headline: "Offsites with a point.",
  subhead: `${cap(numberWord(CORPORATE_MIN_GUESTS))} to ${numberWord(CORPORATE.maxGuestsPerUnit)} guests. An eight-team bracket in the simulator, and a host who writes the run of show.`,
  body: "Teams shoot the bracket in the simulator, guests who qualify get guided lanes, and the lounge is bought out. Quoted per group.",
  cta: { label: "Request a quote", href: "#inquire" },
};

export const BRACKET_TEAMS = ["Team A", "Team B", "Team C", "Team D", "Team E", "Team F", "Team G", "Team H"] as const;
export const BRACKET_ROUNDS = ["Round of 8", "Semis", "Final"] as const;
export const BRACKET_WINNER_LABEL = "Winner";

/** Bracketed: owner placeholder until logos are supplied. */
export const LOGO_STRIP_CAPTION = "[Client logos]";
export const LOGO_STRIP_ALT = "A strip of client logos in a single muted tone.";

/* --------------------------------------------------------------- inquire */

export const EVENTS_INQUIRE: SectionCopy = {
  eyebrow: "Inquire",
  headline: "Tell us about the group.",
  subhead: "We reply within one business day.",
  body: "Date, headcount, occasion. Food or AV if you want them. Buyouts are quoted by a planner.",
};

export const OCCASIONS = ["Offsite", "Party", "Client evening", "Date night list", "Other"] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const BUDGETS = ["Under $2,500", "$2,500 to $5,000", "$5,000 to $10,000", "Over $10,000", "Not sure yet"] as const;

export const EVENT_FORM = {
  fields: {
    name: { label: "Host name", placeholder: "Who we should reply to" },
    company: { label: "Company", placeholder: "Optional" },
    email: { label: "Email", placeholder: "you@example.com" },
    phone: { label: "Phone", placeholder: "Optional" },
    preferredDate: { label: "Preferred date" },
    guests: { label: "Guests" },
    occasion: { label: "Occasion" },
    licenseHolders: { label: "NYC pistol license holders", hint: "Guests without one use the simulator and house long guns where eligible." },
    budget: { label: "Budget", placeholder: "Optional" },
    notes: { label: "Notes", placeholder: "Food, AV, timing, anything else." },
  },
  guests: { min: 2, max: CORPORATE.maxGuestsPerUnit, initial: PRIVATE_SUITE.maxGuestsPerUnit },
  submit: "Send inquiry",
  sending: "Sending",
  success: "Received. A planner replies within one business day.",
  referencePrefix: "Reference #",
  errors: {
    name: "Add a name so we know who to reply to.",
    email: "Enter a valid email so we can reply.",
    generic: `Could not send. Email ${SITE.email} and we will pick it up.`,
  },
  /** Order of the "Key: value" lines in the message the desk receives. */
  messageKeys: { occasion: "Occasion", licenseHolders: "License holders", budget: "Budget", notes: "Notes" },
  unspecified: "Not specified",
};

export const INQUIRE_FOOTNOTE = {
  lead: "Rather talk to a person? Try",
  phone: SITE.phone,
  email: SITE.email,
};
