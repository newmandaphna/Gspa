import { publicCopy } from "@/lib/seo/placeholders";

export type Faq = { id: string; q: string; a: string };

/**
 * Written answers. Entries in HELD_BACK stay out of the site until they can be
 * answered without a licence the club does not hold yet, or a counsel note.
 */
const ALL_FAQ: Faq[] = [
  {
    id: "license",
    q: "Do I need a license?",
    a: "Membership is for holders of a valid New York City pistol license in their own name. Handguns on the line must be listed on the shooter's license, shown at the desk with matching photo ID.",
  },
  {
    id: "rent-handgun",
    q: "Can I rent a handgun?",
    a: "No. New York City law ties every handgun to its licensee, so the only handguns on the line are the ones listed on a shooter's own license.",
  },
  {
    id: "own-firearm",
    q: "Can I bring my own firearm?",
    a: "Yes, if it is listed on your NYC pistol license. Every firearm arrives unloaded and cased, comes out at your lane and nowhere else, and leaves the same way.",
  },
  {
    id: "ammo",
    q: "What about ammunition?",
    a: "The ammunition policy is announced before opening, along with membership details.",
  },
  {
    id: "protection",
    q: "Do I need eye and ear protection?",
    a: "Eye and ear protection is mandatory on the line. Bring your own, and the desk looks it over at check-in, or rent a set at the desk.",
  },
  {
    id: "what-to-wear",
    q: "What should I wear?",
    a: "Closed-toe shoes and a crew neck or higher. Hot brass finds a V-neck. Long hair tied back, brimmed hats off on the line.",
  },
  {
    id: "age",
    q: "Is there a minimum age?",
    a: "Live fire is 18 and over. No exceptions, whoever you came with.",
  },
  {
    id: "training-systems",
    q: "What training systems do you use?",
    a: "Two. The range runs a scenario-based training system over live fire, with targets and video scenarios that respond to your decisions. The multipurpose room holds a laser training system and doubles as the shoot house, with no live ammunition in that room.",
  },
  {
    id: "non-shooters",
    q: "Can non-shooters come and watch?",
    a: "Yes, as a member's guest. Watchers show ID and sign the acknowledgement at the desk, same as everyone.",
  },
  {
    id: "membership",
    q: "When does membership open?",
    a: "Before the doors open. Tiers, benefits and pricing are announced first to the membership list, which you can join on the Membership page.",
  },
  {
    id: "license-through-you",
    q: "Can I get a NYC pistol license through you?",
    a: "No. The NYPD License Division issues licenses, on its own timeline. Nobody at a range can speed the process up or promise an outcome.",
  },
  {
    id: "visitors",
    q: "I'm visiting from abroad. Can I shoot?",
    a: "Live fire depends on your license and your visa status under federal law. Ask the desk before you plan a visit and you will get a straight answer. [Counsel to confirm.]",
  },
  {
    id: "phones",
    q: "Can I take photos or video on the line?",
    a: "Of yourself and your party, yes, with the phone on a lanyard or in a pocket. Never film another guest without asking. A range officer will hold your phone while you shoot if you ask.",
  },
  {
    id: "lead",
    q: "Is there a lead exposure risk?",
    a: "Lead is part of any live-fire range. Wash your hands and face before you eat. If you are pregnant or nursing, talk to your doctor first.",
  },
  {
    id: "parking",
    q: "Is there parking?",
    a: "[Owner to confirm on-site spaces.] Most guests drive or take a car, and rideshares drop at the front door. Directions go out before your visit.",
  },
  {
    id: "events",
    q: "Can I host an event?",
    a: "Yes. Private and group events start with the Events inquiry, and a planner replies within one business day.",
  },
  {
    id: "alcohol",
    q: "Is alcohol served?",
    a: "No. The lounge pours espresso, tea and sparkling water. Nothing impairing before or during a session, full stop.",
  },
];

/** Held back before launch: ammunition sales, construction detail, and the answer still with counsel. */
const HELD_BACK = new Set<string>([]);

export const FAQ: Faq[] = ALL_FAQ.filter((f) => !HELD_BACK.has(f.id)).map((f) => ({ ...f, a: publicCopy(f.a) }));
