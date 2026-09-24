/**
 * Copy for /visit. Edit words here; the page renders from these constants.
 * The address, hours and transit minutes come from src/lib/config/site.ts,
 * the requirements from src/lib/content/requirements.ts, and the questions
 * from src/lib/content/faq.ts. Square brackets are the owner's placeholders
 * and stay until confirmed at the source.
 */
import { FACILITY, SITE } from "@/lib/config/site";

export type Cta = { label: string; href: string; external?: boolean };

export type SectionCopy = {
  eyebrow?: string;
  headline: string;
  subhead: string;
  body?: string;
  cta?: Cta;
  secondary?: Cta;
};

export const VISIT_META = {
  title: "Visit & FAQ",
  description: `Address, transit, hours, what to bring, the requirements list, and short answers. ${SITE.name} is in ${SITE.address.neighborhood}, where the E, J, Z, the LIRR and the JFK AirTrain meet.`,
};

/* ------------------------------------------------------------------ hero */

export const ADDRESS_LINE = `${SITE.address.line1}, ${SITE.address.city}, ${SITE.address.state} ${SITE.address.zip}`;

export const VISIT_HERO: SectionCopy = {
  eyebrow: "Visit",
  headline: "Jamaica, Queens.",
  subhead: "Where the E, J, Z, the LIRR, and JFK meet.",
  body: `${ADDRESS_LINE}. Enter through the doors under the sign.`,
  cta: { label: "Open in Maps", href: SITE.address.mapsUrl, external: true },
};

export const EXTERIOR_PHOTO_ALT = `The street entrance of ${SITE.name} in ${SITE.address.neighborhood}, at dusk, sign lit`;

/* --------------------------------------------------------------- transit */

export const VISIT_TRANSIT: SectionCopy = {
  eyebrow: "Getting here",
  headline: "Getting here.",
  subhead: `${FACILITY.transit.lirrFromPennMin} minutes from Penn Station. ${FACILITY.transit.airtrainFromJfkMin} from the JFK terminal.`,
  body: "Jamaica LIRR and Sutphin Blvd–Archer Av (E, J, Z) are the stops. AirTrain JFK ends at the same station.",
};

export type TransitLine = { id: "lirr" | "subway" | "airtrain"; label: string; stops: string[] };

/** The three ways in, drawn as converging lines. Labels are set in mono. */
export const TRANSIT_LINES: TransitLine[] = [
  { id: "lirr", label: "Jamaica LIRR", stops: ["Penn Station", "Woodside", "Jamaica"] },
  { id: "subway", label: "Sutphin Blvd–Archer Av (E J Z)", stops: ["Manhattan", "Kew Gardens", "Sutphin–Archer"] },
  { id: "airtrain", label: "AirTrain JFK", stops: ["Terminals", "Federal Circle", "Jamaica"] },
];

/** Mono chips. The walk minutes stay bracketed until the owner confirms them in FACILITY. */
export const TRANSIT_CHIPS: string[] = [
  `LIRR · ${FACILITY.transit.walkFromLirrMin} min walk`,
  `E J Z · ${FACILITY.transit.walkFromSubwayMin} min walk`,
  `AirTrain · ${FACILITY.transit.walkFromLirrMin} min walk`,
];

export const MAP_EMBED_LABEL = "[MAP_EMBED] until the address is confirmed";
export const MAP_EMBED_ALT = `Map of the streets around ${SITE.name}, ${SITE.address.neighborhood}`;

/* ----------------------------------------------------------------- hours */

export const VISIT_HOURS: SectionCopy = {
  eyebrow: "Hours",
  headline: "Hours.",
  subhead: "Open seven days.",
  body: "The table below is the one the calendar uses. The last start is close minus the length of your session.",
};

/** Mono line beneath the table. Matches the FAQ answer on lateness. */
export const HOURS_NOTE = "Arrive 15 minutes early for check-in and the briefing. More than 20 minutes late counts as a no-show.";

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
  headline: "What to bring.",
  subhead: "Photo ID. Closed-toe shoes. A calm head.",
  body: "Every requirement is listed below and checked at the desk. Read it once and check-in takes a minute.",
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
  headline: "What you will need.",
  subhead: "Every rule, in one list.",
  body: "The reservation flow shows you the lines that apply to your session. Nothing else on the site restates them. Lines in brackets are with counsel.",
};

export const LAST_REVIEWED_LABEL = "Last reviewed";

/* ------------------------------------------------------------------- faq */

export const VISIT_FAQ: SectionCopy = {
  eyebrow: "FAQ",
  headline: "Questions.",
  subhead: "Short answers. Ask the desk for long ones.",
};

/* --------------------------------------------------------------- contact */

export const VISIT_CONTACT: SectionCopy = {
  eyebrow: "Contact",
  headline: "Contact.",
  subhead: "Concierge, 10 to 10.",
  body: "Call or write. Groups and buyouts start here.",
  secondary: { label: "Press and partnerships", href: `mailto:${SITE.email}?subject=Press%20and%20partnerships`, external: true },
};

export const CONTACT_PHONE_HREF = `tel:${SITE.phone.replace(/[^\d+]/g, "")}`;
export const CONTACT_EMAIL_HREF = `mailto:${SITE.email}`;

/* ---------------------------------------------------------- availability */

export const VISIT_AVAILABILITY_CTA: Cta = { label: "Reserve now", href: "/reserve" };
