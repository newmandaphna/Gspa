import type { ResourceKey, TierKey } from "@/lib/config/site";

export type Category = "lane" | "suite" | "training" | "experience" | "service" | "event";

/** Who can take part. The badge text lives here; the legal wording lives in requirements.ts. */
export type Eligibility = "handgun" | "longgun" | "simulator" | "anyone";

export const ELIGIBILITY_LABELS: Record<Eligibility, string> = {
  handgun: "Pistol license, or your own long gun",
  longgun: "18+ with photo ID · house long gun",
  simulator: "18+ with photo ID · no license",
  anyone: "Open to all",
};

export type CatalogItem = {
  slug: string;
  name: string;
  category: Category;
  resource: ResourceKey;
  durationMin: number;
  /** Price per unit (one lane, one suite, one seat) in cents. Flat when fixedUnits is set. */
  priceCents: number;
  maxGuestsPerUnit: number;
  maxUnitsPerBooking: number;
  tagline: string;
  description: string;
  includes: string[];
  eligibility: Eligibility;
  /** false = shown as "Coming" or inquiry-only (no calendar). */
  bookable: boolean;
  /** Shown on non-bookable cards: "coming" (waitlist) or "inquire" (events form). */
  unavailableMode?: "coming" | "inquire";
  /** Only visible and bookable to signed-in members. */
  memberOnly?: boolean;
  /** Member price per unit in cents (undefined = same as public). */
  memberPriceCents?: number;
  /** Minimum tier required to book. */
  minTier?: TierKey;
  /** Always consumes this many units at a flat price. */
  fixedUnits?: number;
  /** Charged per guest beyond one per unit. */
  extraGuestCents?: number;
  /** Cancellation window in hours (defaults to BOOKING.freeCancelHours). */
  cancelHours?: number;
};

/**
 * The catalog. Prices are placeholders awaiting the owner's approval.
 * Order here is display order.
 */
export const CATALOG: CatalogItem[] = [
  {
    slug: "lane-session",
    name: "Lane Session",
    category: "lane",
    resource: "lane",
    durationMin: 60,
    priceCents: 7500,
    memberPriceCents: 4500,
    maxGuestsPerUnit: 2,
    maxUnitsPerBooking: 3,
    tagline: "One lane. One hour. Your air.",
    description:
      "A 25-yard acoustic lane with a programmable carrier and its own filtered air supply. Up to two shooters share a lane; larger parties take adjoining lanes. Price is per lane.",
    includes: ["25-yard lane, 60 minutes", "Programmable target carrier", "Eye and ear protection", "Two paper targets", "Range officer on the line", "Towel and water service"],
    eligibility: "handgun",
    bookable: true,
  },
  {
    slug: "private-suite",
    name: "Private Suite",
    category: "suite",
    resource: "suite",
    durationMin: 120,
    priceCents: 65000,
    memberPriceCents: 55000,
    maxGuestsPerUnit: 6,
    maxUnitsPerBooking: 1,
    tagline: "Two lanes, a lounge, and a host.",
    description:
      "A closed suite with two 25-yard lanes, a lounge with sofa and screen, and a dedicated host and range officer for two hours. For up to six people. Non-shooting guests are welcome in the lounge.",
    includes: ["Two private 25-yard lanes, 120 minutes", "Attached lounge with screen and espresso", "Dedicated host and range officer", "Protection and targets for six", "Towel service", "Priority check-in"],
    eligibility: "handgun",
    bookable: true,
    cancelHours: 72,
  },
  {
    slug: "founders-suite",
    name: "Founders' Suite",
    category: "suite",
    resource: "suite",
    durationMin: 180,
    priceCents: 140000,
    memberPriceCents: 120000,
    maxGuestsPerUnit: 10,
    maxUnitsPerBooking: 2,
    fixedUnits: 2,
    tagline: "Both suites opened into one. For ten.",
    description:
      "Both private suites with the shared wall opened: four lanes, the full lounge, a host, and a dedicated range officer for three hours. Catering menu at reservation. Reserving it takes both suites for the slot.",
    includes: ["Four private lanes, 180 minutes", "Full lounge and host", "Dedicated range officer", "Protection and targets for ten", "Catering menu, priced separately", "Simulator session for non-shooting guests"],
    eligibility: "handgun",
    bookable: true,
    cancelHours: 72,
  },
  {
    slug: "first-session",
    name: "First Session",
    category: "training",
    resource: "instructor",
    durationMin: 90,
    priceCents: 29500,
    memberPriceCents: 26500,
    extraGuestCents: 14750,
    maxGuestsPerUnit: 2,
    maxUnitsPerBooking: 1,
    tagline: "Your first shots, done right.",
    description:
      "Ninety minutes with one instructor: safety, stance, grip and sight picture in the classroom, then 50 rounds on a house .22 rifle with the instructor beside you. No experience required. A second student joins at half price.",
    includes: ["Certified instructor, 90 minutes", "House .22 rifle and 50 rounds", "Lane, targets, eye and ear protection", "Written fundamentals card to take home", "Second student at 50%"],
    eligibility: "longgun",
    bookable: true,
  },
  {
    slug: "private-instruction",
    name: "Private Instruction",
    category: "training",
    resource: "instructor",
    durationMin: 60,
    priceCents: 22500,
    memberPriceCents: 18000,
    extraGuestCents: 11250,
    maxGuestsPerUnit: 2,
    maxUnitsPerBooking: 1,
    tagline: "Drills built for you, saved to your profile.",
    description:
      "One hour on a lane with a certified instructor. Bring your own firearm where the law allows, or train on a house long gun. Lane fee included. Reserve consecutive hours for longer sessions.",
    includes: ["Certified instructor, 60 minutes", "Lane fee included", "Drill plan saved to your profile", "Protection and targets", "Second student at 50%"],
    eligibility: "longgun",
    bookable: true,
  },
  {
    slug: "nys-ccw-course",
    name: "NYS 18-Hour Concealed Carry Course",
    category: "training",
    resource: "classroom",
    durationMin: 1080,
    priceCents: 59500,
    maxGuestsPerUnit: 1,
    maxUnitsPerBooking: 4,
    tagline: "Sixteen hours of classroom, two of live fire.",
    description:
      "The New York State required course for a concealed carry license application, taught over two consecutive days on site by DCJS-approved instructors, with a certificate on completion. Twelve seats per course. Dates post monthly. Price [owner to confirm].",
    includes: ["16 hours classroom instruction", "2 hours live fire with instructor", "Course materials", "Certificate of completion", "Lunch both days"],
    eligibility: "anyone",
    bookable: false,
    unavailableMode: "inquire",
    cancelHours: 168,
  },
  {
    slug: "simulator-bay",
    name: "Simulator Bay",
    category: "experience",
    resource: "simulator",
    durationMin: 60,
    priceCents: 12000,
    memberPriceCents: 9600,
    maxGuestsPerUnit: 4,
    maxUnitsPerBooking: 2,
    tagline: "Judgment scenarios, no live ammunition.",
    description:
      "An hour in a private simulator bay with laser-recoil pistols and rifles on a 4K wall, from plate racks to branching judgment scenarios, with an instructor debrief. Up to four people share a bay.",
    includes: ["Private simulator bay, 60 minutes", "Laser-recoil pistol and rifle", "Instructor-led scenarios and debrief", "Up to four participants", "Score report emailed after"],
    eligibility: "simulator",
    bookable: true,
  },
  {
    slug: "heritage-rifle",
    name: "Heritage Rifle Session",
    category: "experience",
    resource: "lane",
    durationMin: 60,
    priceCents: 18500,
    maxGuestsPerUnit: 2,
    maxUnitsPerBooking: 1,
    tagline: "Shoot the house collection.",
    description: "An hour on a designated lane with three long guns from the house collection, a range officer alongside, and ammunition included. Opens once the house long-gun program is confirmed.",
    includes: ["Three house long guns", "Ammunition included", "Range officer on the lane", "Protection and targets"],
    eligibility: "longgun",
    bookable: false,
    unavailableMode: "coming",
  },
  {
    slug: "date-night",
    name: "Two Lanes and Espresso",
    category: "experience",
    resource: "simulator",
    durationMin: 120,
    priceCents: 42000,
    maxGuestsPerUnit: 2,
    maxUnitsPerBooking: 1,
    tagline: "Simulator, rifle, then dessert. For two.",
    description: "A two-person evening: 40 minutes in the simulator, 40 minutes on a house rifle with an instructor, 40 minutes in the lounge with espresso and dessert. Price is for two.",
    includes: ["Simulator bay", "Guided rifle session with instructor", "Lounge table with dessert and espresso", "Towel service"],
    eligibility: "longgun",
    bookable: false,
    unavailableMode: "coming",
  },
  {
    slug: "gunsmith-bench",
    name: "Gunsmith Bench Time",
    category: "service",
    resource: "gunsmith",
    durationMin: 30,
    priceCents: 7500,
    memberPriceCents: 0,
    maxGuestsPerUnit: 1,
    maxUnitsPerBooking: 1,
    tagline: "Thirty minutes with the smith.",
    description: "Sight-in, trigger work, fit and function checks, and an honest opinion. Included with membership. Firearms must be lawfully possessed and transported.",
    includes: ["Licensed gunsmith", "Bench, tools and bore light", "Written notes on your profile"],
    eligibility: "anyone",
    bookable: true,
    memberOnly: true,
  },
  {
    slug: "firearm-detailing",
    name: "Firearm Detailing",
    category: "service",
    resource: "detailing",
    durationMin: 45,
    priceCents: 12500,
    memberPriceCents: 0,
    maxGuestsPerUnit: 1,
    maxUnitsPerBooking: 1,
    tagline: "Stripped, cleaned, inspected, returned.",
    description: "Drop-off cleaning and inspection by a licensed gunsmith, returned the same day. Included for Signature and Founders members. NYC handguns require the owner's license on file.",
    includes: ["Full strip and clean", "Function and safety inspection", "Bore-scope photo report", "Same-day return"],
    eligibility: "anyone",
    bookable: true,
    memberOnly: true,
    minTier: "signature",
  },
  {
    slug: "corporate-event",
    name: "Corporate and Private Events",
    category: "event",
    resource: "suite",
    durationMin: 180,
    priceCents: 0,
    maxGuestsPerUnit: 40,
    maxUnitsPerBooking: 1,
    tagline: "The whole floor, or just the suites.",
    description:
      "Offsites, client evenings and celebrations for twelve to forty people, built around simulator brackets, the suites, guided lanes for eligible guests, and the lounge. One range officer per six shooters. Quoted after a conversation with the desk.",
    includes: ["Dedicated event host", "Simulator brackets, suites, or full-floor buyout", "Range officers, one per six shooters", "Catering coordination", "Custom run of show"],
    eligibility: "anyone",
    bookable: false,
    unavailableMode: "inquire",
  },
];

export const CATEGORY_LABELS: Record<Category, string> = {
  lane: "Lanes",
  suite: "Suites",
  training: "Training",
  experience: "Experiences",
  service: "Member Services",
  event: "Events",
};

export function itemBySlug(slug: string): CatalogItem | undefined {
  return CATALOG.find((c) => c.slug === slug);
}

/** Public catalog (what a signed-out visitor can browse and book). */
export function publicCatalog(): CatalogItem[] {
  return CATALOG.filter((c) => !c.memberOnly);
}

/** Everything a member of `tier` may book, including member-only items. */
export function memberCatalog(tier: string): CatalogItem[] {
  return CATALOG.filter((c) => !c.minTier || tierRankOf(tier) >= tierRankOf(c.minTier));
}

function tierRankOf(t: string): number {
  return ["club", "signature", "founders"].indexOf(t);
}
