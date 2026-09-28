/**
 * Every legally sensitive statement on the site lives here, as plain data.
 * Marketing copy never restates a rule; it links here with "See requirements".
 * Lines in [square brackets] await counsel. Have counsel review before launch.
 */

import { BOOKING } from "@/lib/config/site";
import { itemBySlug } from "@/lib/content/catalog";
import { isPlaceholder, publicCopy } from "@/lib/seo/placeholders";

export type RequirementTag = "handgun" | "longgun" | "simulator" | "training" | "guests" | "members" | "all";

export type Requirement = { text: string; tags: RequirementTag[] };

export const REQUIREMENTS_LAST_REVIEWED = "[date]";

/** House floor for live fire. New York State allows supervised shooting from STATE_SUPERVISED_AGE. */
export const LIVE_FIRE_MIN_AGE = 18;
export const STATE_SUPERVISED_AGE = 12;
/** Minutes after the start time at which a reservation becomes a no-show (matches the terms in legal.ts). */
export const LATE_NO_SHOW_MIN = 20;

const ALL_REQUIREMENTS: Requirement[] = [
  { text: "Every guest presents a valid government-issued photo ID at the desk.", tags: ["all"] },
  {
    text: "Handguns require a valid New York City pistol license in your name, shown with matching photo ID. Only handguns listed on that license may be brought or used.",
    tags: ["handgun"],
  },
  { text: "The club does not rent handguns. The only handguns on the line are the ones listed on a shooter's own license.", tags: ["handgun"] },
  { text: "Membership requires a valid New York City pistol license in your name.", tags: ["members"] },
  { text: "The minimum age for live fire is 18.", tags: ["handgun", "longgun", "training"] },
  { text: "Non-immigrant visa holders may be barred from live fire under federal law. Ask the desk before you plan a visit. [Counsel to confirm.]", tags: ["handgun", "longgun", "training"] },
  {
    text: "Every shooter and guest signs the range acknowledgement once every 12 months. [Counsel to frame as assumption of risk and rules acknowledgement under NY GOL § 5-326.]",
    tags: ["all"],
  },
  { text: "New members complete a safety orientation in person before their first session on the line.", tags: ["members"] },
  { text: "Guests shoot under their host member and a range officer, and meet the same requirements as anyone else in that session.", tags: ["guests", "members"] },
  {
    text: "Firearms arrive unloaded and cased, are uncased only at your lane, and leave the same way. Transport must comply with New York City and New York State law.",
    tags: ["handgun", "longgun"],
  },
  { text: "No live ammunition in the training room.", tags: ["training"] },
  { text: "No alcohol, cannabis or other impairment before or during a session.", tags: ["all"] },
  {
    text: "Closed-toe shoes and a crew-neck or higher top on the firing line. Hair tied back, no brimmed hats. Eye and ear protection is mandatory: bring your own or rent it at the desk.",
    tags: ["handgun", "longgun", "training"],
  },
  { text: "Range safety officer instructions are final. A safety violation ends the session without refund and may end a membership.", tags: ["all"] },
  {
    text: `These lines reflect New York City and New York State law${isPlaceholder(REQUIREMENTS_LAST_REVIEWED) ? "" : ` as of ${REQUIREMENTS_LAST_REVIEWED}`}. For current permit rules, consult the NYPD License Division.`,
    tags: ["all"],
  },
];

/** The list a visitor reads: counsel notes stay in the source above and never reach a page. */
export const REQUIREMENTS: Requirement[] = ALL_REQUIREMENTS.map((r) => ({ ...r, text: publicCopy(r.text) }));

/** "Reviewed <date>", or nothing until the owner sets a real date. */
export const REVIEWED_LINE = isPlaceholder(REQUIREMENTS_LAST_REVIEWED) ? "" : `Reviewed ${REQUIREMENTS_LAST_REVIEWED}`;

/** Lines relevant to a catalog item's eligibility, for the booking step. */
export function requirementsFor(eligibility: "handgun" | "longgun" | "simulator" | "anyone", isMember = false): Requirement[] {
  const want = new Set<RequirementTag>(["all"]);
  if (eligibility === "handgun") {
    want.add("handgun");
    want.add("longgun");
  }
  if (eligibility === "longgun") {
    want.add("longgun");
    want.add("training");
  }
  if (eligibility === "simulator") want.add("simulator");
  if (isMember) want.add("members");
  return REQUIREMENTS.filter((r) => r.tags.some((t) => want.has(t)));
}

/** Short acknowledgment shown in the reservation form. */
export const ACK_SUMMARY =
  "I understand that everyone in my party must present valid government photo ID, that handguns require a valid NYC pistol license, and that all guests complete the safety briefing and sign the range acknowledgement on arrival.";

/**
 * The state course cancels on its own, longer window (catalog `cancelHours`).
 * The FAQ, the reserve flow and the legal terms all read these so the number
 * cannot drift from the catalog.
 */
const course = itemBySlug("nys-ccw-course");
export const COURSE_NAME = course?.name ?? "the state course";
export const COURSE_CANCEL_DAYS = Math.round((course?.cancelHours ?? 168) / 24);
const SMALL_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
/** "seven days", spelled out per the voice rule. */
export const COURSE_CANCEL_WINDOW = `${SMALL_WORDS[COURSE_CANCEL_DAYS] ?? String(COURSE_CANCEL_DAYS)} days`;

export const CANCELLATION_POLICY = `Cancel free up to ${BOOKING.freeCancelHours} hours before a lane, training or simulator session, up to ${BOOKING.suiteFreeCancelHours} hours before a suite or event, and up to ${COURSE_CANCEL_WINDOW} before the ${COURSE_NAME}. Inside the window, half the fee is held as lane credit for 12 months. No-shows forfeit the session.`;

/** The four rules, verbatim. Shown on the House Rules page and in Legal. */
export const RANGE_RULES: string[] = [
  "Treat every firearm as if it is loaded.",
  "Keep the muzzle pointed downrange.",
  "Keep your finger off the trigger until your sights are on the target.",
  "Know your target and what is beyond it.",
];

export const RANGE_RULES_LABEL = "The four everyone posts";

/**
 * House rules: what this club decided on top of the four. Decision first,
 * reason second. A draft for the owner to react to; the numbers come from
 * the constants above and from BOOKING so they cannot drift from the terms.
 */
export type HouseRule = { decision: string; reason: string };

export const HOUSE_RULES: HouseRule[] = [
  {
    decision: "The range officer has the last word.",
    reason: "Not the desk, and not the member who brought you.",
  },
  {
    decision: "Nothing impairing, before or during.",
    reason: "Not a beer at lunch, not an edible on the Van Wyck.",
  },
  {
    decision: "Cased in, cased out.",
    reason: "Your firearm comes out at your lane and nowhere else.",
  },
  {
    decision: "Film yourself all you like.",
    reason: "Film another guest without asking and your day is over.",
  },
  {
    decision: "Your brass goes forward.",
    reason: "Hot cases on the floor behind the line are how someone else slips.",
  },
  {
    decision: "Your guests are yours.",
    reason: "What they do on the line is on your membership.",
  },
  {
    decision: `Late is ${LATE_NO_SHOW_MIN} minutes.`,
    reason: "After that the lane goes back on the calendar.",
  },
  {
    decision: "Brimmed hats off on the line.",
    reason: "Hot brass finds the gap.",
  },
  {
    decision: "The lounge is quiet.",
    reason: "Take the call outside.",
  },
  {
    decision: `Live fire is ${LIVE_FIRE_MIN_AGE}.`,
    reason: "No exceptions, whoever you came with.",
  },
];

/** Moves here from the footer. */
export const RANGE_OFFICER_LINE = "Firearms are handled under the supervision of certified Range Safety Officers.";
