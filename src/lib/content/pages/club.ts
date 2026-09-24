/**
 * Copy for /club. Edit words here; the page renders from these constants.
 * Physical facts come from FACILITY and the catalog so a single edit there
 * changes the floor plan, chips and copy together. Square brackets are the
 * owner's placeholders and stay until confirmed in src/lib/config/site.ts.
 */
import { FACILITY, LOCKERS_TOTAL } from "@/lib/config/site";
import { itemBySlug, type CatalogItem } from "@/lib/content/catalog";
import { HOUSE_RULES_LINK } from "@/lib/content/nav";
import { HOUSE_RULES, LIVE_FIRE_MIN_AGE, STATE_SUPERVISED_AGE } from "@/lib/content/requirements";

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
  subhead: "Every lane has its own supply and its own filters.",
  body: "Fresh air comes in behind you, and the lead leaves with it through the filters at the far end. The next lane never breathes yours.",
  secondary: { label: "Read the FAQ", href: "/visit#faq" },
};

/* --------------------------------------------------------------- targets */

export const TARGET_STOPS: readonly number[] = [3, 7, 15, FACILITY.laneYards];

export const CLUB_TARGETS: SectionCopy = {
  eyebrow: "Carriers",
  headline: `Carriers from ${TARGET_STOPS[0]} to ${FACILITY.laneYards} yards`,
  subhead: "Distance, turn and timing, all set from the lane.",
  body: "A drill you like saves to your profile for next time. Nobody walks downrange to hang paper.",
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
  subhead: "The line is behind ballistic glass. The espresso is on this side.",
  body: "Espresso or tea and sparkling water, then a warm towel when you come off the line. No alcohol, ever.",
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
  subhead: `${LOCKERS_TOTAL} lockers, fingerprint or PIN, gear only.`,
  body: "Handguns stay with their licensee; everything else can live here. Detailing and the gunsmith bench are members' services too.",
  cta: { label: "See membership", href: "/membership" },
};

export const LOCKER_NOTE = {
  text: "Fingerprint is optional.",
  link: { label: "Biometric notice", href: "/legal#biometrics" } as Cta,
};

export const SERVICES_EYEBROW = "Members' services";
export const SERVICES_CAPTION = "Brush · Mat · Bore light";

/* ------------------------------------------------------------- decisions */

/**
 * Things we decided: five stances the club took on top of the four rules
 * every range posts. One sentence of decision, one of reason, first person
 * plural. The numbers come from FACILITY, TARGET_STOPS and requirements.ts.
 */
export const CLUB_DECISIONS: SectionCopy = {
  eyebrow: "Things we decided",
  headline: "Things we decided.",
  subhead: `${cap(numberWord(5))} calls we made before the doors opened, and the reason for each.`,
  body: `All ${numberWord(HOUSE_RULES.length)} house rules, two of them repeated above, are on their own page. Every one is a decision first and a reason second.`,
  cta: { label: "Read the house rules", href: HOUSE_RULES_LINK.href },
};

export type Decision = { decision: string; reason: string };

export const DECISIONS: Decision[] = [
  {
    decision: `Live fire is ${LIVE_FIRE_MIN_AGE} here.`,
    reason: `The state allows supervised shooting from ${STATE_SUPERVISED_AGE}. We set our own floor and we look at it again every year.`,
  },
  {
    decision: "No alcohol in the lounge, and none in you.",
    reason: "Nothing impairing before or during a session, so the lounge pours espresso.",
  },
  {
    decision: "No house handguns.",
    reason: "The law says so, and we would not rent them anyway.",
  },
  {
    decision: `Every lane runs ${FACILITY.laneYards} yards.`,
    reason: `That covers every pistol distance, and the carriers stop at ${TARGET_STOPS.slice(0, -1).join(", ")} and ${FACILITY.laneYards}.`,
  },
  {
    decision: "Every lane has its own air.",
    reason: "It cost more, and the lead leaves with it instead of drifting to the next bench.",
  },
];

/* ---------------------------------------------------------- availability */

export const CLUB_AVAILABILITY_CTA: Cta = { label: "Reserve now", href: "/reserve" };
