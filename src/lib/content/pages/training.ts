/**
 * Training page copy. Edit words here; the page renders from these constants.
 * Prices, durations and eligibility come from the catalog; physical facts
 * (instructors, classroom seats) come from FACILITY in src/lib/config/site.ts.
 * Square brackets are reserved for owner placeholders and are never invented here.
 */

import { FACILITY, SITE } from "@/lib/config/site";
import { ELIGIBILITY_LABELS, itemBySlug, type CatalogItem } from "@/lib/content/catalog";
import { formatMoney } from "@/lib/time";

const simulatorBay = itemBySlug("simulator-bay");
const firstSession = itemBySlug("first-session");
const privateInstruction = itemBySlug("private-instruction");
const ccwCourse = itemBySlug("nys-ccw-course");

function spell(n: number): string {
  const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  return n >= 0 && n < 10 ? words[n] : String(n);
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function minutesLabel(min: number): string {
  if (min % 60 === 0 && min >= 120) return `${min / 60} hr`;
  return `${min} min`;
}

export const TRAINING_META = {
  title: "Training",
  description: `Certified instruction at ${SITE.name} in Jamaica, Queens: the simulator, First Session, private instruction, plus the New York State 18-hour course, all taught on site.`,
} as const;

export const HERO = {
  eyebrow: "Training",
  headline: "Learn it right the first time.",
  subhead: "Certified instructors and feedback on every shot.",
  body: "First shot or ten thousandth, an instructor stands at your shoulder and says so when a fundamental slips.",
  cta: { label: "Reserve a session", href: "/reserve?category=training" },
  link: { label: "See requirements", href: "/visit#requirements" },
  imageSlot: "TRAINING_PHOTO_01",
  imageAlt: "An instructor beside a student on the line, both looking downrange at a tightening group",
} as const;

/* ------------------------------------------------------------------------
   The ladder. Five steps, each assuming only the one before it.
   Bookable items link into the reservation flow; the rest carry a chip.
   --------------------------------------------------------------------- */
export type Rung = {
  slug: string;
  label: string;
  duration: string;
  price: string;
  href?: string;
  chip?: "Coming" | "Inquire";
};

function rungFrom(item: CatalogItem | undefined, label: string, fallbackSlug: string): Rung {
  if (!item) return { slug: fallbackSlug, label, duration: "", price: "", chip: "Coming" };
  const base = { slug: item.slug, label, duration: minutesLabel(item.durationMin), price: formatMoney(item.priceCents) };
  if (item.bookable) return { ...base, href: `/reserve?experience=${item.slug}` };
  if (item.unavailableMode === "inquire") return { ...base, href: "/visit#contact", chip: "Inquire" };
  return { ...base, chip: "Coming" };
}

export const LADDER = {
  eyebrow: "The ladder",
  headline: "The ladder has five rungs.",
  subhead: "It starts on the simulator and ends with a state certificate.",
  body: "Simulator, First Session, Private Instruction, the NYS 18-hour course, Defensive Scenarios. Each step assumes only the one before it, and the first assumes nothing.",
  rungs: [
    rungFrom(simulatorBay, "Simulator", "simulator-bay"),
    rungFrom(firstSession, "First Session", "first-session"),
    rungFrom(privateInstruction, "Private Instruction", "private-instruction"),
    rungFrom(ccwCourse, "NYS 18-hour course", "nys-ccw-course"),
    /* Future item: not in the catalog yet, so no price and no link. */
    { slug: "defensive-scenarios", label: "Defensive Scenarios", duration: "", price: "", chip: "Coming" },
  ] as ReadonlyArray<Rung>,
  requirements: { label: "See requirements", href: "/visit#requirements" },
} as const;

/* ------------------------------------------------------------------------
   First Session. Bookable. Card facts come straight from the catalog item.
   --------------------------------------------------------------------- */
export const FIRST_SESSION = {
  eyebrow: "First Session",
  headline: "First Session.",
  subhead: "Ninety minutes with an instructor who assumes nothing.",
  body: "Safety and stance in the classroom, grip and sight picture next, then 50 rounds through a house .22 with your instructor at your elbow. No experience needed.",
  steps: ["Safety", "Stance", "Grip", "Sights", "Live fire"],
  cta: { label: "Reserve First Session", href: "/reserve?experience=first-session" },
  requirements: { label: "See requirements", href: "/visit#requirements" },
  card: {
    name: firstSession?.name ?? "First Session",
    duration: firstSession ? `${firstSession.durationMin} min` : "90 min",
    price: firstSession ? formatMoney(firstSession.priceCents) : "",
    priceNote: "per student",
    secondStudent: firstSession?.extraGuestCents ? `Second student ${formatMoney(firstSession.extraGuestCents)}` : "",
    includes: firstSession?.includes ?? [],
    eligibility: ELIGIBILITY_LABELS[firstSession?.eligibility ?? "longgun"],
  },
} as const;

/* ------------------------------------------------------------------------
   Private instruction. Headshot slots and credential lines are editable here.
   --------------------------------------------------------------------- */
export type Instructor = { slot: string; name: string; credential: string; alt: string };

export const PRIVATE = {
  eyebrow: "Private instruction",
  headline: "One on one.",
  subhead: "An instructor to yourself, at the hour you choose.",
  body: "Drills built around whatever you came to fix, written up and saved to your profile. A second student joins at half price. For a longer session, reserve consecutive hours.",
  cta: { label: "Reserve private instruction", href: "/reserve?experience=private-instruction" },
  requirements: { label: "See requirements", href: "/visit#requirements" },
  price: privateInstruction ? `${formatMoney(privateInstruction.priceCents)} · ${privateInstruction.durationMin} minutes · lane fee included` : "",
  secondStudent: privateInstruction?.extraGuestCents ? `Second student ${formatMoney(privateInstruction.extraGuestCents)}` : "",
  eligibility: ELIGIBILITY_LABELS[privateInstruction?.eligibility ?? "longgun"],
  diagram: { left: "Instructor", right: "You" },
  instructorsHeadline: `${cap(spell(FACILITY.instructors))} instructors, every one certified.`,
  instructors: [
    { slot: "INSTRUCTOR_PHOTO_01", name: "[Name]", credential: "[Name], NRA Certified Instructor", alt: "Portrait of the first instructor" },
    { slot: "INSTRUCTOR_PHOTO_02", name: "[Name]", credential: "[Name], DCJS-approved instructor", alt: "Portrait of the second instructor" },
    { slot: "INSTRUCTOR_PHOTO_03", name: "[Name]", credential: "[Name], Range Safety Officer", alt: "Portrait of the third instructor" },
  ] as ReadonlyArray<Instructor>,
} as const;

/* ------------------------------------------------------------------------
   New York State course. Inquiry-only until dates post.
   --------------------------------------------------------------------- */
const cancelDays = ccwCourse?.cancelHours ? Math.round(ccwCourse.cancelHours / 24) : 7;

export const COURSES = {
  eyebrow: "State course",
  headline: "The 18-hour course.",
  subhead: "The concealed carry course, taught here over two consecutive days.",
  body: `Sixteen hours in the classroom and two on the line, with lunch both days. ${cap(spell(FACILITY.classroomSeats))} seats per date. New dates post monthly.`,
  numeral: "16 + 2",
  numeralCaption: "classroom + live fire",
  seats: FACILITY.classroomSeats,
  seatsCaption: `${FACILITY.classroomSeats} seats per date`,
  calendarCaption: "Two consecutive days",
  /** Day numbers ringed in the month grid. Placeholder until dates post. */
  ringedDays: [13, 14],
  cta: { label: "Ask about dates", href: "/visit#contact" },
  priceLine: ccwCourse ? `${formatMoney(ccwCourse.priceCents)} per seat [owner to confirm]` : "",
  note: `Cancel free up to ${spell(cancelDays)} days before.`,
  eligibility: ELIGIBILITY_LABELS[ccwCourse?.eligibility ?? "anyone"],
  requirements: { label: "See requirements", href: "/visit#requirements" },
} as const;

/* ------------------------------------------------------------------------
   Simulator curriculum.
   --------------------------------------------------------------------- */
export const SIMULATOR = {
  eyebrow: "Simulator",
  headline: "Judgment.",
  subhead: "For civilians and security professionals, four to a bay.",
  body: "Each scenario branches on what you do, and an instructor debriefs it after. No live ammunition.",
  cta: { label: "Reserve the simulator", href: "/reserve?experience=simulator-bay" },
  link: { label: "See the simulator", href: "/club#simulator" },
  price: simulatorBay ? `${formatMoney(simulatorBay.priceCents)} · ${simulatorBay.durationMin} minutes · up to ${spell(simulatorBay.maxGuestsPerUnit)}` : "",
  eligibility: ELIGIBILITY_LABELS[simulatorBay?.eligibility ?? "simulator"],
  tree: {
    root: "Contact",
    branches: ["Cover", "Command"],
    leaves: ["Observe", "Move", "Speak", "Act"],
    /** Index of the leaf whose branch draws in gold. */
    goldLeaf: 1,
  },
} as const;

/* ------------------------------------------------------------------------
   The license, step by step. Only the course happens here.
   --------------------------------------------------------------------- */
export const LICENSE = {
  eyebrow: "The process",
  headline: "How the license works.",
  subhead: "Four steps, one of them here. We walk the rest with you.",
  body: "Everything from the application to the decision belongs to the NYPD License Division. The required course happens here, your training record stays in one file, and the desk can talk you through any step.",
  nodes: [
    { label: "Apply", note: "NYPD License Division" },
    { label: "Course", note: "Here", here: true },
    { label: "Interview", note: "NYPD" },
    { label: "Decision", note: "NYPD" },
  ],
  note: "The clock belongs to the NYPD.",
  cta: { label: "Read the FAQ", href: "/visit#faq" },
  requirements: { label: "See requirements", href: "/visit#requirements" },
} as const;
