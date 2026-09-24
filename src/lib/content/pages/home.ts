/**
 * Home page copy. Edit words here; the page renders from these constants.
 * Physical facts come from FACILITY (src/lib/config/site.ts) so one edit
 * changes the hero, the floor plan and the spec chips together.
 * Square brackets are reserved for owner placeholders and are never invented here.
 */

import { BOOKING, FACILITY, SITE } from "@/lib/config/site";
import { ELIGIBILITY_LABELS, itemBySlug } from "@/lib/content/catalog";
import { MEMBERSHIP_TIERS } from "@/lib/content/membership";
import { formatMoney } from "@/lib/time";

/** Voice rule: numerals when the number is the point; otherwise spell out one through nine. */
export function spell(n: number): string {
  const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  return n >= 0 && n < 10 ? words[n] : String(n);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const laneSession = itemBySlug("lane-session");
const privateSuite = itemBySlug("private-suite");
const simulatorBay = itemBySlug("simulator-bay");
const firstSession = itemBySlug("first-session");

export const HOME_META = {
  title: `${SITE.name} | Private Shooting Club, Jamaica, Queens`,
  description: SITE.description,
} as const;

export const HERO = {
  headline: SITE.tagline,
  subhead: "A private shooting club in Jamaica, Queens.",
  body: `${FACILITY.laneCount} acoustic lanes, ${spell(FACILITY.suites)} private suites off the line, ${spell(FACILITY.simulatorBays)} simulator bays. ${FACILITY.transit.airtrainFromJfkMin} minutes from JFK on the AirTrain.`,
  cta: { label: "Reserve a lane", href: "/reserve?category=lane" },
  link: { label: "Explore membership", href: "/membership" },
  imageSlot: "HERO_PHOTO_01",
  imageAlt: "The firing line at The Gun Spa, lit lanes receding toward the targets",
} as const;

export const QUIET = {
  eyebrow: "The room",
  headline: "A quiet place to be loud.",
  subhead: "Baffled walls and filtered air, with lights you set from the lane.",
  body: "Baffling swallows the echo before it reaches the next lane. Dim the lights from where you stand. You leave calmer than you arrived.",
  captions: ["Baffled", "Ventilated", "Dimmable"],
  link: { label: "See the lanes", href: "/club" },
} as const;

export const LANES = {
  eyebrow: "Lanes",
  headline: "Pick your lane, or two.",
  subhead: `${FACILITY.laneYards} yards on all ${FACILITY.laneCount} lanes, each with its own carrier and air.`,
  body: "Program the carrier from where you stand, and reserve two side by side when you bring friends.",
  chips: [`${FACILITY.laneYards} yd`, "Own air supply", "Programmable carrier", "Acoustic baffling"],
  cta: { label: "Reserve a lane", href: "/reserve?category=lane" },
  requirements: { label: "See requirements", href: "/visit#requirements" },
  eligibility: ELIGIBILITY_LABELS[laneSession?.eligibility ?? "handgun"],
  priceFrom: laneSession ? `${formatMoney(laneSession.priceCents)} per lane, ${laneSession.durationMin} minutes` : "",
  laneLabel: (n: number) => `Lane ${String(n).padStart(2, "0")} / ${FACILITY.laneYards} yd`,
} as const;

export const SUITES = {
  eyebrow: "Private suites",
  headline: "A range of your own.",
  subhead: `${cap(spell(FACILITY.suites))} private suites with ${spell(FACILITY.lanesPerSuite)} lanes each and their own lounge.`,
  body: `Frosted glass, a sofa, a screen, a host outside the door. Room for ${spell(privateSuite?.maxGuestsPerUnit ?? 6)} people who would rather have the place to themselves.`,
  cta: { label: "Reserve a suite", href: "/reserve?category=suite" },
  link: { label: "See the suites", href: "/club#suites" },
  imageSlot: "SUITE_PHOTO_01",
  imageAlt: "A private suite: two lanes behind frosted glass with a sofa and a screen in the attached lounge",
  caption: privateSuite ? `${privateSuite.name} · ${privateSuite.durationMin} min · ${formatMoney(privateSuite.priceCents)}` : "Private Suite",
} as const;

export const SIMULATOR = {
  eyebrow: "Simulator",
  headline: "Start here.",
  subhead: `${cap(spell(FACILITY.simulatorBays))} simulator bays with no live ammunition.`,
  body: `Scenarios branch on what you do; an instructor debriefs you after. Up to ${spell(simulatorBay?.maxGuestsPerUnit ?? 4)} people share a bay for an hour.`,
  cta: { label: "Reserve the simulator", href: "/reserve?experience=simulator-bay" },
  requirements: { label: "See requirements", href: "/visit#requirements" },
  eligibility: ELIGIBILITY_LABELS[simulatorBay?.eligibility ?? "simulator"],
  cornerLabels: { scenario: "Scenario 04", clock: "00:42", bay: "Bay 01", mode: "Judgment" },
  imageSlot: "SIM_PHOTO_01",
  imageAlt: "A simulator bay: a laser-recoil pistol raised toward a 4K wall mid-scenario",
} as const;

export const FIRST_SESSION = {
  eyebrow: "First Session",
  headline: firstSession?.tagline ?? "Your first shots, done right.",
  subhead: `${firstSession?.durationMin ?? 90} minutes with an instructor who assumes nothing.`,
  body: "Safety, stance, grip, sight picture: the classroom comes first. Then live fire on a house rifle with the instructor at your shoulder. No experience required.",
  steps: ["Safety", "Stance", "Grip", "Sights", "Live fire"],
  cta: { label: "Reserve First Session", href: "/reserve?experience=first-session" },
  requirements: { label: "See requirements", href: "/visit#requirements" },
  eligibility: ELIGIBILITY_LABELS[firstSession?.eligibility ?? "longgun"],
  price: firstSession ? `${formatMoney(firstSession.priceCents)} · ${firstSession.durationMin} minutes` : "",
} as const;

export type HospitalityIconKey = "towel" | "espresso" | "locker" | "brush";

export const HOSPITALITY = {
  eyebrow: "The lounge",
  headline: "The spa part is not a metaphor.",
  subhead: "Warm towels and a proper espresso.",
  body: "The towel is warm before you ask. Members keep their gear in a locker that opens to a fingerprint or a PIN. You go home smelling like the espresso.",
  items: [
    { key: "towel", label: "Towels", note: "Every visit" },
    { key: "espresso", label: "Espresso", note: "The lounge" },
    { key: "locker", label: "Lockers", note: "Members" },
    { key: "brush", label: "Detailing", note: "Members" },
  ] as ReadonlyArray<{ key: HospitalityIconKey; label: string; note: string }>,
  footnote: "Lockers and firearm detailing are members' services.",
  link: { label: "See the lounge", href: "/club#lounge" },
  membersLink: { label: "Explore membership", href: "/membership" },
  imageSlot: "LOUNGE_PHOTO_01",
  imageAlt: "The lounge: an espresso on a low table, warm towels folded, the firing line behind ballistic glass",
} as const;

export const MEMBERSHIP = {
  eyebrow: "Membership",
  headline: "Membership is the product.",
  subhead: `${cap(spell(MEMBERSHIP_TIERS.length))} tiers, all vetted the same way, all with guests.`,
  body: "Members reserve further ahead and keep a locker. Founders hold same-day priority; guests come in at the member rate.",
  caption: "days ahead",
  publicWindowNote: `Public reservations open ${spell(BOOKING.maxAdvanceDays)} days ahead.`,
  cta: { label: "Compare tiers", href: "/membership#tiers" },
  tiers: MEMBERSHIP_TIERS.map((t) => ({
    key: t.key,
    name: t.name,
    days: t.bookingWindowDays,
    price: t.price,
    priceNote: t.priceNote,
    tagline: t.tagline,
    highlight: Boolean(t.highlight),
    limited: t.limited,
  })),
} as const;

export const VISIT = {
  eyebrow: "Visit",
  headline: `${FACILITY.transit.airtrainFromJfkMin} minutes from JFK.`,
  subhead: `${SITE.address.neighborhood}. E, J or Z train, or the LIRR.`,
  body: `Take the AirTrain from your terminal, or the LIRR from Penn in ${FACILITY.transit.lirrFromPennMin} minutes. The address and the hours are on the Visit page.`,
  cta: { label: "Plan your visit", href: "/visit" },
  hoursLink: { label: "See hours", href: "/visit#hours" },
  stations: ["Jamaica LIRR", "Sutphin Blvd-Archer Av", "AirTrain JFK"],
  pin: SITE.shortName,
  imageSlot: "EXTERIOR_PHOTO_01",
  imageAlt: "The exterior of The Gun Spa at dusk, the wordmark lit above the door",
} as const;

export const AVAILABILITY = {
  requirements: { label: "See requirements", href: "/visit#requirements" },
  calendar: { label: "See the full calendar", href: "/reserve" },
} as const;
