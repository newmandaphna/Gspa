/**
 * Copy for /club. Edit words here; the page renders from these constants.
 * Physical facts come from FACILITY and the catalog so a single edit there
 * changes the floor plan, chips and copy together. Square brackets are the
 * owner's placeholders and stay until confirmed in src/lib/config/site.ts.
 */
import { FACILITY, LOCKERS_TOTAL } from "@/lib/config/site";
import { itemBySlug, type CatalogItem } from "@/lib/content/catalog";

export type Cta = { label: string; href: string };

export type SectionCopy = {
  eyebrow?: string;
  headline: string;
  subhead: string;
  body: string;
  cta?: Cta;
  secondary?: Cta;
};

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

/** One through twelve spelled out (voice rule); larger numbers stay numerals. */
export function numberWord(n: number): string {
  return WORDS[n] ?? String(n);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function item(slug: string): CatalogItem {
  const found = itemBySlug(slug);
  if (!found) throw new Error(`Catalog item missing: ${slug}`);
  return found;
}

export const PRIVATE_SUITE = item("private-suite");
export const FOUNDERS_SUITE = item("founders-suite");
export const SIMULATOR = item("simulator-bay");
export const GUNSMITH = item("gunsmith-bench");
export const DETAILING = item("firearm-detailing");

export const REQUIREMENTS_LINK: Cta = { label: "See requirements", href: "/visit#requirements" };

export const CLUB_META = {
  title: "The Club",
  description: `${FACILITY.sqft} square feet on one level in Jamaica, Queens: ${numberWord(FACILITY.laneCount)} acoustic lanes, ${numberWord(FACILITY.suites)} private suites, ${numberWord(FACILITY.simulatorBays)} simulator bays, a lounge behind ballistic glass and a classroom for ${numberWord(FACILITY.classroomSeats)}.`,
};

/* ------------------------------------------------------------------ hero */

export const CLUB_HERO: SectionCopy = {
  eyebrow: "The Club",
  headline: "Built like a studio, run like a range.",
  subhead: `${FACILITY.sqft} square feet on one level in Jamaica, Queens.`,
  body: "Lanes, suites, simulator bays, a lounge, lockers, a classroom, all on one floor with a host at the desk.",
};

export type ZoneKey = "lanes" | "suites" | "sim" | "classroom" | "lounge" | "lockers" | "desk";

/** Captions on the floor plan, in eyebrow type. */
export const FLOOR_ZONE_LABELS: Record<ZoneKey, string> = {
  lanes: `${FACILITY.laneCount} lanes · ${FACILITY.laneYards} yd`,
  suites: `${FACILITY.suites} suites`,
  sim: `${FACILITY.simulatorBays} sim bays`,
  classroom: `Classroom · ${FACILITY.classroomSeats}`,
  lounge: "Lounge",
  lockers: `Lockers · ${LOCKERS_TOTAL}`,
  desk: "Desk",
};

export const CLUB_PHOTO_ALT = "The range floor at The Gun Spa, seen from the lounge through the glass";

/* ------------------------------------------------------------------- air */

export const CLUB_AIR: SectionCopy = {
  eyebrow: `Air changes: ${FACILITY.airChangesPerHour} per hour`,
  headline: "The air goes one way: downrange.",
  subhead: "Downrange airflow and filtration on every lane.",
  body: "Fresh air comes in behind you, and the lead leaves with it through the filters at the far end.",
  secondary: { label: "Read the FAQ", href: "/visit#faq" },
};

/* --------------------------------------------------------------- targets */

export const TARGET_STOPS: readonly number[] = [3, 7, 15, FACILITY.laneYards];

export const CLUB_TARGETS: SectionCopy = {
  eyebrow: "Carriers",
  headline: "Targets that listen.",
  subhead: `Programmable carriers from ${TARGET_STOPS[0]} to ${FACILITY.laneYards} yards.`,
  body: "Distance, turn, timing: all set from the lane. A drill you like saves to your profile for next time.",
};

/* ---------------------------------------------------------------- suites */

export const CLUB_SUITES: SectionCopy = {
  eyebrow: "Private suites",
  headline: `${cap(numberWord(FACILITY.suites))} suites behind ${numberWord(FACILITY.suites)} doors.`,
  subhead: `A private ${numberWord(FACILITY.lanesPerSuite)}-lane bay with its own lounge.`,
  body: `A sofa and a screen, espresso in the lounge, plus a range officer who works only your party. Nobody else shares the line. Open both suites and the ${FOUNDERS_SUITE.name} seats ${numberWord(FOUNDERS_SUITE.maxGuestsPerUnit)}.`,
  cta: { label: "Reserve a suite", href: "/reserve?category=suite" },
};

/** Spec list read from the private-suite catalog item. */
export const SUITE_SPECS: string[] = [
  `${cap(numberWord(FACILITY.lanesPerSuite))} lanes`,
  `Up to ${numberWord(PRIVATE_SUITE.maxGuestsPerUnit)}`,
  "Dedicated range officer",
  `${PRIVATE_SUITE.durationMin} minutes`,
];

export const SUITE_PLAN_CAPTION = `Opens to the ${FOUNDERS_SUITE.name}`;
export const SUITE_PHOTO_ALT = "A private suite: two lanes behind glass with a sofa and a screen in the attached lounge";

/* ------------------------------------------------------------- simulator */

export const CLUB_SIMULATOR: SectionCopy = {
  eyebrow: "Simulator",
  headline: "Shoot the wall on purpose.",
  subhead: "Laser-recoil pistols and rifles on a 4K wall.",
  body: "Steel on a timer, or a scenario that branches on your call. Instructors run defensive coursework on these bays.",
  cta: { label: "Reserve the simulator", href: `/reserve?experience=${SIMULATOR.slug}` },
};

export const SIMULATOR_CHIPS: string[] = ["Steel", "Timed drills", "Decision scenarios", "Laser recoil"];

/* ---------------------------------------------------------------- lounge */

export const CLUB_LOUNGE: SectionCopy = {
  eyebrow: "Lounge",
  headline: "Exhale.",
  subhead: "A lounge that feels like a members' club, because it is.",
  body: "Espresso or tea and sparkling water, then a warm towel when you come off the line. The lanes are right there behind ballistic glass. No alcohol, ever.",
};

export type LoungeIconKind = "cup" | "towel" | "wifi" | "glass";

export const LOUNGE_FEATURES: { icon: LoungeIconKind; label: string }[] = [
  { icon: "cup", label: "Espresso, tea, sparkling water" },
  { icon: "towel", label: "Towel service" },
  { icon: "wifi", label: "Wifi on the floor" },
  { icon: "glass", label: "Ballistic glass to the line" },
];

export const LOUNGE_CAPTION = "Lounge · the line through glass";
export const LOUNGE_PHOTO_ALT = "The lounge at The Gun Spa, espresso on the table, the lanes visible through the glass wall";

/* --------------------------------------------------------------- lockers */

export const CLUB_LOCKERS: SectionCopy = {
  eyebrow: "Lockers",
  headline: "Keep your gear here.",
  subhead: "A locker for your gear, a bench for your firearm.",
  body: `${LOCKERS_TOTAL} gear lockers for members, each opened by fingerprint or PIN. Detailing and the gunsmith bench are members' services too.`,
  cta: { label: "See membership", href: "/membership" },
};

export const LOCKER_NOTE = {
  text: "Fingerprint is optional.",
  link: { label: "Biometric notice", href: "/legal#biometrics" } as Cta,
};

export const SERVICES_EYEBROW = "Members' services";
export const SERVICES_CAPTION = "Brush · Mat · Bore light";

/* ---------------------------------------------------------------- safety */

export const CLUB_SAFETY: SectionCopy = {
  eyebrow: "Safety",
  headline: "Four rules. No exceptions.",
  subhead: "A range officer on every string, every day.",
  body: "Short rules are the ones people remember.",
  cta: { label: "Read the range rules", href: "/legal#range-rules" },
};

/* ---------------------------------------------------------- availability */

export const CLUB_AVAILABILITY_CTA: Cta = { label: "Reserve now", href: "/reserve" };
