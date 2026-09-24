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
  description: `Certified instruction at ${SITE.name}: the simulator, First Session, private instruction and the New York State 18-hour course, taught on site in Jamaica, Queens.`,
} as const;

export const HERO = {
  eyebrow: "Training",
  headline: "Learn it right the first time.",
  subhead: "Certified instructors. Small groups. Real feedback.",
  body: "Whether it is your first shot or your thousandth, someone is watching your fundamentals.",
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
  headline: "Five steps. One ladder.",
  subhead: "Start on the simulator. End with a state certificate.",
  body: "Simulator, First Session, Private Instruction, the NYS 18-hour course, Defensive Scenarios. Each step assumes only the one before it.",
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
  subhead: "Ninety minutes. One instructor. Zero assumptions.",
  body: "Safety, stance, grip and sight picture in the classroom, then 50 rounds on a house rifle with your instructor beside you. No experience required.",
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
  subhead: "Private instruction, on your lane, on your schedule.",
  body: "Drills built for your goals and saved to your profile. A second student joins at half price. Reserve consecutive hours for a longer session.",
  cta: { label: "Reserve private instruction", href: "/reserve?experience=private-instruction" },
  requirements: { label: "See requirements", href: "/visit#requirements" },
  price: privateInstruction ? `${formatMoney(privateInstruction.priceCents)} · ${privateInstruction.durationMin} minutes · lane fee included` : "",
  secondStudent: privateInstruction?.extraGuestCents ? `Second student ${formatMoney(privateInstruction.extraGuestCents)}` : "",
  eligibility: ELIGIBILITY_LABELS[privateInstruction?.eligibility ?? "longgun"],
  diagram: { left: "Instructor", right: "You" },
  instructorsHeadline: `${cap(spell(FACILITY.instructors))} instructors. One standard.`,
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
  headline: "New York State courses.",
  subhead: "The 18-hour concealed carry course, taught on site.",
  body: `Sixteen hours of classroom, two of live fire, one certificate. ${cap(spell(FACILITY.classroomSeats))} seats per date. Dates post monthly.`,
  numeral: "16 + 2",
  numeralCaption: "classroom + live fire",
  seats: FACILITY.classroomSeats,
  seatsCaption: `${FACILITY.classroomSeats} seats per date`,
  calendarCaption: "Two consecutive days, one weekend",
  /** Day numbers ringed in the month grid. Placeholder until dates post. */
  ringedDays: [13, 14],
  cta: { label: "Ask about dates", href: "/visit#contact" },
  priceLine: ccwCourse ? `${formatMoney(ccwCourse.priceCents)} per seat [owner to confirm]` : "",
  note: `Free cancellation to ${spell(cancelDays)} days before.`,
  eligibility: ELIGIBILITY_LABELS[ccwCourse?.eligibility ?? "anyone"],
  requirements: { label: "See requirements", href: "/visit#requirements" },
} as const;

/* ------------------------------------------------------------------------
   Simulator curriculum.
   --------------------------------------------------------------------- */
export const SIMULATOR = {
  eyebrow: "Simulator",
  headline: "Decisions under pressure.",
  subhead: "Simulator curriculum for civilians, security professionals, and teams.",
  body: "Branching scenarios with an instructor debrief. No live fire.",
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
   The license, decoded. Only the course happens here.
   --------------------------------------------------------------------- */
export const LICENSE = {
  eyebrow: "The process",
  headline: "The license, decoded.",
  subhead: "NYC licensing is a process. We will walk it with you.",
  body: "We do not issue licenses and cannot speed the NYPD. We can explain the steps, host the required course, and keep your training records in one place.",
  nodes: [
    { label: "Apply", note: "NYPD License Division" },
    { label: "Course", note: "Here", here: true },
    { label: "Interview", note: "NYPD" },
    { label: "Decision", note: "NYPD" },
  ],
  note: "Timelines set by the NYPD, not by us.",
  cta: { label: "Read the FAQ", href: "/visit#faq" },
  requirements: { label: "See requirements", href: "/visit#requirements" },
} as const;
