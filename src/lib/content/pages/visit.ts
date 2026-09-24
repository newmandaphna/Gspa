/**
 * Copy for /visit. Edit words here; the page renders from these constants.
 * The address, hours and transit minutes come from src/lib/config/site.ts,
 * the requirements from src/lib/content/requirements.ts, and the questions
 * from src/lib/content/faq.ts. Square brackets are the owner's placeholders
 * and stay until confirmed at the source.
 */
import { FACILITY, HOURS, SITE } from "@/lib/config/site";
import { REQUIREMENTS } from "@/lib/content/requirements";

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];

/** Numbers under twenty spelled out for running copy (voice rule). */
function numberWord(n: number): string {
  return ONES[n] ?? String(n);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export type Cta = { label: string; href: string; external?: boolean };

export type SectionCopy = {
  eyebrow?: string;
  headline: string;
  subhead: string;
  body?: string;
  cta?: Cta;
  secondary?: Cta;
};

/** "09:00" for a day of week becomes "9" for running copy. */
function openHour(dow: number): string {
  const h = HOURS[dow];
  if (!h) return "";
  const n = Number(h.open.slice(0, 2)) % 12;
  return String(n || 12);
}

/** "22:00" for a day of week becomes "10" for running copy. */
function closeHour(dow: number): string {
  const h = HOURS[dow];
  if (!h) return "";
  const n = Number(h.close.slice(0, 2)) % 12;
  return String(n || 12);
}

export const VISIT_META = {
  title: "Visit & FAQ",
  description: `How to reach ${SITE.name} at ${SITE.address.line1} in ${SITE.address.neighborhood}, ${FACILITY.transit.driveFromJfkMin} minutes from JFK. Hours, parking, what to bring, every requirement in one list, plus short answers to the usual questions.`,
};

/* ------------------------------------------------------------------ hero */

export const ADDRESS_LINE = `${SITE.address.line1}, ${SITE.address.city}, ${SITE.address.state} ${SITE.address.zip}`;

export const VISIT_HERO: SectionCopy = {
  eyebrow: "Visit",
  headline: "Jamaica, Queens.",
  subhead: `On Rockaway Blvd, ${FACILITY.transit.driveFromJfkMin} minutes north of the JFK terminals.`,
  body: `${ADDRESS_LINE}. Come in through the doors under the sign.`,
  cta: { label: "Open in Maps", href: SITE.address.mapsUrl, external: true },
};

export const EXTERIOR_PHOTO_ALT = `The street entrance of ${SITE.name} in ${SITE.address.neighborhood}, at dusk, sign lit`;

/* ------------------------------------------------------------- why here */

/**
 * Why a runway and not a high street. Only what FACILITY and the address
 * say, plus what anyone who has driven Rockaway Blvd knows. What the
 * building was before is the owner's to supply, so it is not here.
 */
export const VISIT_WHY = {
  eyebrow: "Why here",
  headline: "Why a runway and not a high street",
  subhead: `You cannot put a ${FACILITY.laneYards}-yard live-fire range under apartments.`,
  paragraphs: [
    `So the club sits where south Queens meets the airport fence: ${SITE.address.line1}, off the ${FACILITY.transit.expressway.split(" (")[0]}, at the north fence of JFK, on the boulevard the cargo trucks use. The neighbors are freight and a runway, which is what ${numberWord(FACILITY.laneCount)} lanes with their own air need.`,
    `The airport is the point. ${cap(numberWord(FACILITY.transit.driveFromJfkMin))} minutes from any terminal means a layover shoots: land, take a car up Rockaway Blvd, an hour in the simulator or on a lane, and back through security. Members from Manhattan come the other way, ${FACILITY.transit.driveFromManhattanMin} minutes down the Van Wyck.`,
    "One honest line about traffic. Rockaway Blvd carries the cargo traffic all day and the Van Wyck slows after 4 PM, so give the trip back more room than the map says.",
  ],
} as const;

/* --------------------------------------------------------------- transit */

export const VISIT_TRANSIT: SectionCopy = {
  eyebrow: "Getting here",
  headline: "Come by car, or the bus.",
  subhead: `${FACILITY.transit.driveFromJfkMin} minutes from any JFK terminal, ${FACILITY.transit.driveFromManhattanMin} from Manhattan.`,
  body: `Leave the ${FACILITY.transit.expressway} at the ${FACILITY.transit.exit} exit. The ${FACILITY.transit.busLine} bus runs the length of Rockaway Blvd, and ${FACILITY.transit.nearestLirr} on the LIRR is a ${FACILITY.transit.lirrDriveMin}-minute cab ride. ${FACILITY.transit.parking}.`,
};

export type TransitLine = { id: "lirr" | "subway" | "airtrain"; label: string; stops: string[] };

/** The three ways in, drawn as converging lines. Labels are set in mono. */
export const TRANSIT_LINES: TransitLine[] = [
  { id: "lirr", label: "From Manhattan, Van Wyck Expwy", stops: ["Midtown", "Kew Gardens", "Rockaway Blvd exit"] },
  { id: "subway", label: `${FACILITY.transit.busLine} bus, Rockaway Blvd`, stops: ["Ozone Park", "150th St", "158th St"] },
  { id: "airtrain", label: "JFK terminals", stops: ["Terminals", "JFK Expwy", "Rockaway Blvd"] },
];

/** Mono chips. Bracketed minutes stay bracketed until the owner confirms them in FACILITY. */
export const TRANSIT_CHIPS: string[] = [
  `JFK · ${FACILITY.transit.driveFromJfkMin} min by car`,
  `Manhattan · ${FACILITY.transit.driveFromManhattanMin} min by car`,
  `${FACILITY.transit.busLine} bus · ${FACILITY.transit.busWalkMin} min walk`,
];

export const MAP_EMBED_LABEL = "[MAP_EMBED] until the address is confirmed";
export const MAP_EMBED_ALT = `Map of the streets around ${SITE.name}, ${SITE.address.neighborhood}`;

/* ----------------------------------------------------------------- hours */

export const VISIT_HOURS: SectionCopy = {
  eyebrow: "Hours",
  headline: `Open until ${closeHour(1)} most nights, ${closeHour(0)} on Sundays.`,
  subhead: `Weekends open at ${openHour(6)}, weekdays at ${openHour(1)}.`,
  body: "This table is the one the calendar reads. The last start of the day is closing time minus the length of your session.",
};

/** Mono line beneath the table. Matches the FAQ answer on lateness. */
export const HOURS_NOTE = "Come 15 minutes early for check-in and the safety briefing. More than 20 minutes late counts as a no-show.";

export const OPEN_STATUS_LABELS = {
  openNow: "Open now",
  opensAt: "Opens at",
  closedToday: "Closed today",
  closedForTonight: "Closed for tonight",
  until: "until",
} as const;

/* ----------------------------------------------------------------- bring */

export const VISIT_BRING: SectionCopy = {
  eyebrow: "What to bring",
  headline: "Bring ID and shoes you can stand in.",
  subhead: "We have the rest: eye and ear protection, targets, a towel.",
  body: "The full list is below and the desk checks every line of it. Read it once before you come and check-in takes a minute.",
  cta: { label: "See requirements", href: "#requirements" },
};

export type BringItem = { id: "id" | "shoes" | "calm"; caption: string };

export const BRING_ITEMS: BringItem[] = [
  { id: "id", caption: "ID" },
  { id: "shoes", caption: "Shoes" },
  { id: "calm", caption: "Calm" },
];

/* ---------------------------------------------------------- requirements */

export const VISIT_REQUIREMENTS: SectionCopy = {
  eyebrow: "Requirements",
  headline: "Read this once.",
  subhead: `${cap(numberWord(REQUIREMENTS.length))} lines, the same card the desk keeps.`,
  body: "When you reserve, the flow shows only the lines that apply to that session. Nothing else on the site restates them. Brackets mean counsel is still on it, and the date at the foot of the card is the last review.",
};

export const LAST_REVIEWED_LABEL = "Last reviewed";

/* ------------------------------------------------------------------- faq */

export const VISIT_FAQ: SectionCopy = {
  eyebrow: "FAQ",
  headline: "Anything else?",
  subhead: "Short answers here. The desk has the long ones.",
};

/* --------------------------------------------------------------- contact */

export const VISIT_CONTACT: SectionCopy = {
  eyebrow: "Contact",
  headline: "Someone at the desk picks up",
  subhead: `Whenever the doors are open, until ${closeHour(1)} most nights.`,
  body: "Call or write. Groups and buyouts start with the desk.",
  secondary: { label: "Press and partnerships", href: `mailto:${SITE.email}?subject=Press%20and%20partnerships`, external: true },
};

export const CONTACT_PHONE_HREF = `tel:${SITE.phone.replace(/[^\d+]/g, "")}`;
export const CONTACT_EMAIL_HREF = `mailto:${SITE.email}`;

/* ---------------------------------------------------------- availability */

export const VISIT_AVAILABILITY_CTA: Cta = { label: "Reserve now", href: "/reserve" };
