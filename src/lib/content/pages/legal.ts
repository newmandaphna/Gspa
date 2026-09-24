/**
 * Copy for /legal. Edit words here; the page renders from these constants.
 * Numbers (windows, cancellation hours, the screening fee, tier names) come
 * from src/lib/config/site.ts, the catalog and membership.ts so the legal
 * text always matches the reservation flow. Lines in [square brackets] are
 * the owner's or counsel's placeholders and stay until confirmed.
 * Nothing here is legal advice; counsel reviews before launch.
 */
import { BOOKING, SITE, TIER_WINDOW_DAYS } from "@/lib/config/site";
import { itemBySlug } from "@/lib/content/catalog";
import { MEMBERSHIP_TIERS, SCREENING_FEE_CENTS, tierByKey } from "@/lib/content/membership";
import { formatMoney } from "@/lib/time";

export type LegalSectionId = "privacy" | "terms" | "screening" | "membership-agreement" | "biometrics" | "range-rules" | "waiver";

export type Cta = { label: string; href: string };

export type Clause = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  /** The page renders a data block right after this clause. */
  slot?: "retention-table";
};

export type LegalSection = {
  id: LegalSectionId;
  /** Short label for the anchor list. */
  label: string;
  headline: string;
  subhead: string;
  /** Mono stamp under the subhead. */
  updated: string;
  clauses: Clause[];
  /** Bracketed note for counsel, rendered verbatim at the end of the section. */
  counselNote?: string;
  /** "Verb the noun >" links after the clauses. */
  links?: Cta[];
};

export type RetentionRow = { data: string; why: string; howLong: string };

/* ------------------------------------------------------------- shared */

/** One stamp for every section until counsel signs off on each. */
export const LEGAL_UPDATED = "[date]";

export const SCREENING_VENDOR = "[Vendor]";
export const PRIVACY_EMAIL = SITE.email;

const course = itemBySlug("nys-ccw-course");
const COURSE_CANCEL_DAYS = Math.round((course?.cancelHours ?? 168) / 24);

const FEE = formatMoney(SCREENING_FEE_CENTS);
const founders = tierByKey("founders");
/** Tiers that pay the screening fee at application (refunded if declined). */
const FEE_TIERS = MEMBERSHIP_TIERS.filter((t) => !t.screeningFeeWaived)
  .map((t) => t.name)
  .join(" and ");
const TIER_WINDOWS = MEMBERSHIP_TIERS.map((t) => `${t.name} ${TIER_WINDOW_DAYS[t.key]}`).join(", ");

export const LEGAL_META = {
  title: "Legal",
  description: "Privacy, terms of reservation, the screening process, the membership agreement, the biometric notice, the range rules and the acknowledgement, in plain English on one page.",
};

export const LEGAL_HERO = {
  eyebrow: "Legal",
  headline: "The fine print, in plain English.",
  subhead: "Everything you agree to at the club, on one page.",
  body: "Read what you need and skip the rest. Lines in square brackets are still with counsel or the owner and change before launch.",
};

export const NAV_LABEL = "On this page";

export const BACK_TO_RESERVE: Cta = { label: "Back to Reserve", href: "/reserve" };
export const SEE_REQUIREMENTS: Cta = { label: "See requirements", href: "/visit#requirements" };

/* ------------------------------------------------------------ privacy */

export const RETENTION_HEADERS = { data: "Data", why: "Why", howLong: "How long" };

export const RETENTION_ROWS: RetentionRow[] = [
  { data: "Reservation and guest details", why: "To run the reservation and reach you about it.", howLong: "3 years after the visit" },
  { data: "Acknowledgements, with name, timestamp, IP address and browser", why: "To prove acceptance of the range rules.", howLong: "7 years" },
  { data: "ID checks at the desk", why: "Recorded as a yes or no flag with the document type. Never an image.", howLong: "3 years" },
  { data: "License and permit numbers", why: "To verify eligibility for the lane you reserve. Stored encrypted.", howLong: "3 years after your last visit, or on request" },
  { data: "Membership applications and references", why: "To decide membership. References are asked one question.", howLong: "Reference replies 1 year, then deleted" },
  { data: "Screening results", why: `Consumer reports are held by ${SCREENING_VENDOR}. The club keeps the decision and any adverse-action record.`, howLong: "Decision 5 years; the report itself 1 year" },
  { data: "Event leads", why: "To quote and plan the event.", howLong: "2 years" },
  { data: "Lane credit ledger", why: "To apply credit at the desk.", howLong: "12 months after the credit expires" },
  { data: "Member-match cookie", why: "A signed, httpOnly cookie holding only a member id, set after you open the emailed link.", howLong: "30 days" },
  { data: "Analytics", why: "[Privacy-preserving analytics vendor, or none.] No cross-site tracking, no advertising pixels.", howLong: "[Per vendor]" },
];

export const PRIVACY: LegalSection = {
  id: "privacy",
  label: "Privacy",
  headline: "Privacy.",
  subhead: "What we collect, why, and for how long.",
  updated: LEGAL_UPDATED,
  clauses: [
    {
      heading: "What we collect",
      paragraphs: [
        "When you reserve, the club records your name, email, phone, party size and the session you chose. At the desk, staff confirm your photo ID and record only that it was checked and what kind of document it was. No copy or image of the ID is kept.",
        "Members also give a license or permit number, references, and written authorization for a background screen. Screening results come back from a third party and are used only to decide the application and, once a year, to confirm the membership.",
        "If you sign in to the members portal, a signed cookie holding only your member id keeps you matched to your account for 30 days.",
      ],
    },
    {
      heading: "Why we collect it",
      paragraphs: [
        "To run your reservation, to confirm that everyone on the line is eligible for the activity they reserved, to decide and maintain memberships, and to keep the record of who accepted the range rules and when. The club does not sell personal information and does not use it for advertising.",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: ["The table below is the whole retention schedule. Anything not listed is deleted when the reason for holding it ends."],
      slot: "retention-table",
    },
    {
      heading: "Payments",
      paragraphs: [
        "Card payments are processed by Stripe. Your card number never reaches the club's systems. The club sees the last four digits, the card brand, and the result of the charge, and keeps the receipt for the reservation for accounting purposes.",
      ],
    },
    {
      heading: "Safeguards under the New York SHIELD Act",
      paragraphs: ["The club keeps reasonable administrative, technical and physical safeguards for private information, including:"],
      bullets: [
        "Encryption of license numbers and screening records at rest, and of all traffic in transit.",
        "Access limited to desk and admin roles, with a log of who looked at what.",
        "A written incident response plan, reviewed each year.",
        "Vendor contracts with security terms, including Stripe and the screening vendor.",
        "Notice to affected New York residents in the manner and timeframe the Act requires.",
      ],
    },
    {
      heading: "Your copy, and deletion",
      paragraphs: [
        `Email ${PRIVACY_EMAIL} from the address on file to ask for a copy of what the club holds about you, or to have it deleted. The club replies within 30 days and deletes everything it is not required to keep under the schedule above. If something must stay, the reply says which record and for how long.`,
      ],
    },
  ],
  counselNote: "[Counsel to review.]",
};

/* -------------------------------------------------------------- terms */

export const TERMS: LegalSection = {
  id: "terms",
  label: "Terms",
  headline: "Terms.",
  subhead: "Reservations, cancellations, refunds, conduct.",
  updated: LEGAL_UPDATED,
  clauses: [
    {
      heading: "Reservations",
      paragraphs: [
        `Public reservations open ${BOOKING.maxAdvanceDays} days ahead and start on the half hour, with at least ${BOOKING.leadTimeMin / 60} hours' notice. Members reserve further out by tier: ${TIER_WINDOWS} days. A reservation is confirmed when you receive the confirmation email with its code.`,
        "A reservation is for the named guest and party. Everyone in the party must meet the requirements for the activity, which are listed on the Visit page and in the range rules below. The desk may decline entry to anyone who does not, and the reservation is treated as a no-show.",
      ],
    },
    {
      heading: "Cancellations and lane credit",
      paragraphs: [
        `Lanes, training and the simulator cancel free up to ${BOOKING.freeCancelHours} hours before the session. Suites and events cancel free up to ${BOOKING.suiteFreeCancelHours} hours before. Seats in the ${course?.name ?? "concealed carry course"} cancel free up to ${COURSE_CANCEL_DAYS} days before the first day.`,
        "Inside the window, half the fee is held as lane credit for 12 months from the date of the cancellation. Lane credit applies to any reservation at the desk, does not convert to cash, and is not transferable. The cancel link is in your confirmation email.",
      ],
    },
    {
      heading: "Arrival and no-shows",
      paragraphs: [
        "Arrive 15 minutes early for check-in and the safety briefing. Your session ends at its scheduled time regardless of when you start. More than 20 minutes late counts as a no-show, and a no-show forfeits the session and its fee.",
      ],
    },
    {
      heading: "Changes made by the club",
      paragraphs: [
        "If the club cancels a session for any reason, including weather, equipment or staffing, you receive a full refund to the original payment method or, if you prefer, a new time. The club is not responsible for travel or other costs.",
      ],
    },
    {
      heading: "Conduct",
      paragraphs: [
        "Range officer instructions are final. A safety violation ends the session without refund and may end a membership. The club may remove anyone who is impaired, who films other guests without permission, or whose behavior puts anyone at risk, and the reservation is treated as a no-show.",
        "The club is a private facility and may refuse service consistent with law.",
      ],
    },
    {
      heading: "Prices and payment",
      paragraphs: [
        "Prices are shown at reservation and include the items listed for that experience. Ammunition, targets beyond those included, and catering are charged at the desk. Where online payment is offered it is taken at reservation; otherwise payment is due at the desk on arrival.",
      ],
    },
  ],
  counselNote: "[Counsel to review.]",
  links: [SEE_REQUIREMENTS, { label: "Manage a reservation", href: "/reserve/manage" }],
};

/* ---------------------------------------------------------- screening */

export const SCREENING_BY = `Screening by ${SCREENING_VENDOR}`;

export const SCREENING: LegalSection = {
  id: "screening",
  label: "Screening",
  headline: "Screening.",
  subhead: "How the background screen works and what you receive.",
  updated: LEGAL_UPDATED,
  clauses: [
    {
      heading: "Disclosure",
      paragraphs: [
        `The Gun Spa may obtain a consumer report about you from ${SCREENING_VENDOR}, a consumer reporting agency, to decide your application for membership and, once a year while you remain a member, to confirm the membership. The report may include identity verification, criminal history records, and public records. This disclosure is made in a document that consists solely of the disclosure, as the Fair Credit Reporting Act requires.`,
      ],
    },
    {
      heading: "Authorization",
      paragraphs: [
        `By signing the authorization on its own page during the application, you authorize the club to obtain the report described above from ${SCREENING_VENDOR}, and you authorize the annual re-screen for as long as your membership continues. You may withdraw the authorization at any time by writing to ${PRIVACY_EMAIL}, which ends the application or the membership.`,
      ],
    },
    {
      heading: "Before a decision is made",
      paragraphs: [
        "If anything in the report may affect the decision, the club sends you a copy of the report and the Consumer Financial Protection Bureau's summary of your rights before any decision is final. You then have at least five business days to respond, correct the record with the vendor, or add context.",
      ],
    },
    {
      heading: "If the application is declined",
      paragraphs: [
        `If the decision is based in whole or in part on the report, you receive a written notice that names ${SCREENING_VENDOR} and gives its address and phone number, states that the vendor did not make the decision and cannot explain it, and explains your right to dispute the accuracy or completeness of the report with the vendor and to obtain a free copy of it within 60 days.`,
        "The club reviews every application against the criteria published here.",
      ],
    },
    {
      heading: "Criteria",
      paragraphs: ["Membership requires all of the following:"],
      bullets: [
        "Verified identity that matches the application.",
        "A licensing status consistent with the activities you intend to reserve. See the requirements for what each activity asks for.",
        "A report with no record that would make possession or handling of a firearm unlawful, and no record of violence within [N] years.",
        "Two references who confirm they know you and would shoot beside you.",
        "Completion of the in-person orientation.",
      ],
    },
    {
      heading: "The fee",
      paragraphs: [
        `${FEE_TIERS} applicants pay a ${FEE} screening fee at application. It is refunded in full if the application is declined. ${founders?.name ?? "Founders"} applicants do not pay the fee.`,
      ],
    },
  ],
  counselNote: "[Counsel to review.]",
  links: [{ label: "Apply for membership", href: "/membership#apply" }],
};

/* ----------------------------------------------------- membership */

export const MEMBERSHIP_AGREEMENT: LegalSection = {
  id: "membership-agreement",
  label: "Membership agreement",
  headline: "Membership agreement.",
  subhead: "Term, renewal, transfer, suspension, refunds.",
  updated: LEGAL_UPDATED,
  clauses: [
    {
      heading: "Term and renewal",
      paragraphs: [
        "Membership runs for one year from activation and renews automatically for a further year at the then-current rate. The club emails you 30 days before renewal, and you may cancel the renewal any time before it takes effect by replying to that email or writing to the desk. Monthly plans, where offered, are twelve payments against the annual term, not a month-to-month membership.",
        `${founders?.name ?? "Founders"} members may instead pay once for a lifetime membership at the price shown on the Membership page. A lifetime membership does not renew and is not refunded, except as set out under termination below.`,
      ],
    },
    {
      heading: "Transfer",
      paragraphs: [
        "Membership is personal to the named member and cannot be sold, lent, or transferred to anyone else, including a family member. Guest passes issued to a tier may be given to a guest, and are the only transferable benefit.",
      ],
    },
    {
      heading: "Included sessions and rates",
      paragraphs: [
        "Included lane hours, suite sessions and instruction reset at each renewal and do not carry over or convert to cash. Member rates apply to the member and to guests within the tier's guest allowance. Reservation windows by tier are set out in the Terms above.",
      ],
    },
    {
      heading: "Guests",
      paragraphs: [
        `Each tier includes a number of guests per visit: ${MEMBERSHIP_TIERS.map((t) => `${t.name} ${t.guestsPerVisit}`).join(", ")}. You are responsible for your guests: they shoot under you and a range officer, must meet the requirements for the activity, sign the acknowledgement, and follow the range rules. A guest's safety violation counts as yours. A guest may visit as a guest no more than six times a year before applying.`,
      ],
    },
    {
      heading: "Suspension",
      paragraphs: [
        "The club may suspend a membership immediately for a safety violation, for impairment on the premises, for a change in licensing status, or for conduct that puts staff or other members at risk. The club writes to you within five business days with the reason and, where the suspension is not permanent, what is needed to restore it. No refund is due for the period of a suspension.",
      ],
    },
    {
      heading: "Termination and refunds",
      paragraphs: [
        "You may end your membership at any time by writing to the desk. Fees already paid for the current term are not refunded.",
        "If the club ends your membership for a reason other than a safety violation, a licensing change or a breach of this agreement, including closure of the club, you receive a pro-rated refund of the unused part of the current term, or of the lifetime fee over ten years. Membership that the club ends for cause is not refunded.",
      ],
    },
    {
      heading: "Lockers and property",
      paragraphs: [
        "Lockers are for gear only and remain the club's property. The club may open a locker with notice for safety, maintenance, or when a membership ends, and holds the contents for 30 days before disposing of them. Firearm storage rules are in the requirements.",
      ],
    },
    {
      heading: "Changes",
      paragraphs: [
        "The club may change this agreement with 30 days' written notice. If a change materially reduces your benefits, you may cancel within those 30 days and receive a pro-rated refund of the current term.",
      ],
    },
  ],
  counselNote: "[Counsel to review.]",
  links: [{ label: "Compare tiers", href: "/membership#tiers" }],
};

/* --------------------------------------------------------- biometrics */

export const BIOMETRICS: LegalSection = {
  id: "biometrics",
  label: "Biometrics",
  headline: "Biometric notice.",
  subhead: "Fingerprint lockers are optional. A PIN works the same.",
  updated: LEGAL_UPDATED,
  clauses: [
    {
      heading: "Notice under NYC Administrative Code § 22-1201",
      paragraphs: [
        "The Gun Spa collects, retains, converts, stores and uses biometric identifier information, in the form of a fingerprint template, from members who choose fingerprint access to their locker. This notice is also posted in plain language at the entrance, in the form the code specifies.",
      ],
    },
    {
      heading: "What it is used for",
      paragraphs: [
        "The template opens your locker and nothing else. It is not used to identify you at the desk, on the range floor, or on camera, and it is not matched against any outside database.",
      ],
    },
    {
      heading: "What we never do with it",
      paragraphs: [
        "The club never sells, leases, trades, shares or otherwise profits from biometric identifier information, and never discloses it to anyone outside the locker system's storage vendor except as the law requires.",
      ],
    },
    {
      heading: "The alternative",
      paragraphs: [
        "Every locker also opens with a PIN. You may choose a PIN instead of a fingerprint at any time, and switching to a PIN deletes the template within 30 days.",
      ],
    },
    {
      heading: "Retention and deletion",
      paragraphs: [
        "Templates are stored encrypted and are deleted within 30 days after the membership ends, after you switch to a PIN, or on your written request, whichever comes first. The club keeps a record that the template was deleted, not the template itself.",
      ],
    },
  ],
  counselNote: "[Counsel to confirm signage text and template storage vendor.]",
};

/* -------------------------------------------------------- range rules */

export const RANGE_RULES_COPY = {
  id: "range-rules" as const,
  label: "Range rules",
  eyebrow: "Range rules",
  headline: "Four rules. No exceptions.",
  subhead: "The requirements list follows, verbatim, with the tags the reservation flow uses.",
  updated: LEGAL_UPDATED,
  requirementsHeading: "Requirements",
  requirementsIntro: "The same list the desk and the reservation flow use. Tags show which activities a line applies to.",
  reviewedLabel: "Last reviewed",
};

export const TAG_LABELS: Record<string, string> = {
  all: "Everyone",
  handgun: "Handguns",
  longgun: "Long guns",
  simulator: "Simulator",
  training: "Training",
  guests: "Guests",
  members: "Members",
};

/* ---------------------------------------------------- acknowledgement */

export const ACKNOWLEDGEMENT = {
  id: "waiver" as const,
  label: "Acknowledgement",
  eyebrow: "Acknowledgement",
  headline: "The acknowledgement.",
  subhead: "Assumption of risk and rules acknowledgement, signed once every 12 months.",
  updated: LEGAL_UPDATED,
  signedNote: "Signed at the desk or on your phone before arrival.",
  counselNote: "[Counsel to review under NY GOL § 5-326.]",
  paragraphs: [
    "I am here to use a live-fire range, a simulator bay, or both, at The Gun Spa. I understand that shooting involves risks that no amount of care removes entirely, including injury from the discharge of a firearm, ricochet, ejected brass, noise, and exposure to lead and other combustion products. I accept those risks knowingly and voluntarily.",
    "I have read the four range rules and the requirements list, and I agree to follow them and every instruction from a range officer. I understand that a range officer's instruction is final, that a safety violation ends my session without refund, and that it may end a membership.",
    "I confirm that I meet the requirements for the activity I reserved, that any firearm I bring is lawfully possessed and transported, and that any ammunition I bring meets the club's specification. I will tell the desk if any of this changes.",
    "I am not impaired by alcohol, cannabis, medication or anything else, and I will leave the firing line if I become unwell or unsure.",
    "I am responsible for the conduct of any guest I bring, and I will make sure each guest has signed this acknowledgement before they reach the line.",
    "This acknowledgement stays in force for 12 months from the date I sign it. I have read it in full, I have had the chance to ask questions, and I sign it freely.",
  ],
};

/** Sections in page order, for the anchor list. */
export const LEGAL_NAV: { id: LegalSectionId; label: string }[] = [
  { id: PRIVACY.id, label: PRIVACY.label },
  { id: TERMS.id, label: TERMS.label },
  { id: SCREENING.id, label: SCREENING.label },
  { id: MEMBERSHIP_AGREEMENT.id, label: MEMBERSHIP_AGREEMENT.label },
  { id: BIOMETRICS.id, label: BIOMETRICS.label },
  { id: RANGE_RULES_COPY.id, label: RANGE_RULES_COPY.label },
  { id: ACKNOWLEDGEMENT.id, label: ACKNOWLEDGEMENT.label },
];

export const LONG_FORM_SECTIONS: LegalSection[] = [PRIVACY, TERMS, SCREENING, MEMBERSHIP_AGREEMENT, BIOMETRICS];
