/**
 * Every legally sensitive statement on the site lives here, as plain data.
 * Marketing copy never restates a rule; it links here with "See requirements".
 * Lines in [square brackets] await counsel. Have counsel review before launch.
 */

import { BOOKING } from "@/lib/config/site";
import { itemBySlug } from "@/lib/content/catalog";

export type RequirementTag = "handgun" | "longgun" | "simulator" | "training" | "guests" | "members" | "all";

export type Requirement = { text: string; tags: RequirementTag[] };

export const REQUIREMENTS_LAST_REVIEWED = "[date]";

/** House floor for live fire. New York State allows supervised shooting from STATE_SUPERVISED_AGE. */
export const LIVE_FIRE_MIN_AGE = 18;
export const STATE_SUPERVISED_AGE = 12;
/** Minutes after the start time at which a reservation becomes a no-show (matches the terms in legal.ts). */
export const LATE_NO_SHOW_MIN = 20;

export const REQUIREMENTS: Requirement[] = [
  {
    text: "Every guest presents a valid government-issued photo ID at the desk. Passports are accepted.",
    tags: ["all"],
  },
  {
    text: "Handguns require a valid New York City pistol license (Premises, Carry Business or Carry Guard) in your name, shown with matching photo ID. Only handguns listed on that license may be brought or used.",
    tags: ["handgun"],
  },
  {
    text: "The Gun Spa does not rent handguns. There are no house handguns on the range floor.",
    tags: ["handgun", "all"],
  },
  {
    text: "Rifles and shotguns: 18 or older with photo ID. House long guns are used on designated lanes only. [Counsel to confirm house long-gun access for unlicensed visitors, and NYC Rifle/Shotgun Permit rules for residents bringing their own.]",
    tags: ["longgun", "training"],
  },
  {
    text: `Minimum age for live fire is ${LIVE_FIRE_MIN_AGE} as a house rule. New York State allows supervised shooting from ${STATE_SUPERVISED_AGE}; the club sets its own floor and reviews it every year.`,
    tags: ["handgun", "longgun", "training"],
  },
  {
    text: "Simulator bays: 18 or older with photo ID. Guests 16 and 17 may use the simulator with a parent or legal guardian in the bay. No license is required.",
    tags: ["simulator"],
  },
  {
    text: "Non-immigrant visa holders may be barred from live fire under federal law. [Counsel to confirm.] The simulator is open to all visitors 18 and over with a passport.",
    tags: ["handgun", "longgun", "training"],
  },
  {
    text: "Every shooter and guest signs the range acknowledgement once every 12 months, on their phone before arrival or at the desk. [Counsel to frame as assumption of risk and rules acknowledgement under NY GOL § 5-326.]",
    tags: ["all"],
  },
  {
    text: "New members complete a 20-minute in-person orientation before their first lane session.",
    tags: ["members"],
  },
  {
    text: "Membership requires identity verification, a review of licensing status, and a third-party background screen with your written authorization. [Counsel to review FCRA disclosure, authorization and adverse-action notices.] Declined Club and Signature applicants receive the screening fee back.",
    tags: ["members"],
  },
  {
    text: "Guests must be eligible for the activity they join, shoot under the host member and a range officer, and may visit as a guest no more than six times a year before applying.",
    tags: ["guests", "members"],
  },
  {
    text: "Firearms arrive unloaded and cased, are uncased only at your lane, and leave the same way. Transport must comply with New York law. Lockers are for gear only; the club does not store handguns for non-licensees.",
    tags: ["handgun", "longgun"],
  },
  {
    text: "Ammunition: brass- or nickel-cased, non-magnetic, non-armor-piercing rounds only. No steel core, tracer or reloads. House ammunition is sold at the desk for use on the premises. [Counsel to confirm NYS ammunition background-check compliance.]",
    tags: ["handgun", "longgun", "training"],
  },
  {
    text: "No alcohol, cannabis or other impairment before or during a session. The lounge is non-alcoholic.",
    tags: ["all"],
  },
  {
    text: "Closed-toe shoes and a crew-neck or higher top on the firing line. Hair tied back, no brimmed hats. Eye and ear protection is mandatory and provided.",
    tags: ["handgun", "longgun", "training"],
  },
  {
    text: "Biometric lockers use a fingerprint or a PIN, your choice. Biometric data is never sold or shared. [Notice per NYC Admin Code § 22-1201.]",
    tags: ["members"],
  },
  {
    text: "Range safety officer instructions are final. A safety violation ends the session without refund and may end a membership.",
    tags: ["all"],
  },
  {
    text: `These lines reflect New York State and New York City law as of ${REQUIREMENTS_LAST_REVIEWED}. For current permit rules, consult the NYPD License Division.`,
    tags: ["all"],
  },
];

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

export const HOUSE_RULES_DRAFT_LINE = `Draft for the owner. Reviewed ${REQUIREMENTS_LAST_REVIEWED}.`;

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
    reason: `The state says ${STATE_SUPERVISED_AGE}. We chose ${LIVE_FIRE_MIN_AGE} and we look at it again every year.`,
  },
];

/** Moves here from the footer. */
export const RANGE_OFFICER_LINE = "Firearms are handled under the supervision of certified Range Safety Officers.";
