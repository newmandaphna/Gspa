import { BOOKING } from "@/lib/config/site";
import { COURSE_CANCEL_WINDOW, COURSE_NAME } from "@/lib/content/requirements";

export type Faq = { id: string; q: string; a: string };

export const FAQ: Faq[] = [
  {
    id: "rent-handgun",
    q: "Can I rent a handgun?",
    a: "No. New York City requires a valid NYC pistol license to handle a handgun, and there are no house handguns here. Licensed shooters bring their own. Without a license you still have the simulator and First Session, plus instruction on a house long gun. All three open at 18 with photo ID.",
  },
  {
    id: "no-license",
    q: "What can I do here without any license?",
    a: "Quite a lot: the simulator bays, First Session, private instruction on a house long gun and most of the training ladder. The requirements list spells out what each one asks for.",
  },
  {
    id: "permit-to-visit",
    q: "Do I need a permit to visit?",
    a: "Not for the simulator, First Session or instruction on a house long gun. A handgun of any kind on the premises needs a valid NYC pistol license in your name.",
  },
  {
    id: "non-member",
    q: "Can I shoot without being a member?",
    a: "Yes. Lanes and suites are open to the public by reservation. So are training and the simulator, all subject to the requirements list. Membership buys a longer calendar and guest privileges, plus the $45 lane rate.",
  },
  {
    id: "how-far-ahead",
    q: "How far ahead can I reserve?",
    a: "Seven days for the public. Members see further: 14 days at Club, 21 at Signature, 30 at Founders, with same-day priority. Every reservation needs at least two hours' notice.",
  },
  {
    id: "own-firearm",
    q: "Can I bring my own firearm?",
    a: "Yes, if you possess it lawfully. A handgun has to be listed on your NYC pistol license, which you show at the desk. Every firearm arrives unloaded and cased, comes out at your lane and nowhere else, and leaves the same way.",
  },
  {
    id: "own-ammo",
    q: "Can I bring my own ammunition?",
    a: "Yes, within the rules: brass or nickel cases, nothing magnetic, nothing armor-piercing. No steel core, no tracer, no reloads. The desk sells house ammunition in common calibers for use on the premises.",
  },
  {
    id: "own-protection",
    q: "Can I bring my own eye and ear protection?",
    a: "Yes, and the desk looks it over at check-in. Ours is included, meets ANSI Z87.1 for eyes, and members can ask for electronic muffs.",
  },
  {
    id: "what-to-wear",
    q: "What should I wear?",
    a: "Closed-toe shoes and a crew neck or higher. Hot brass goes down a V-neck, and it has, more than once. Long hair tied back, brimmed hats off on the line.",
  },
  {
    id: "calibers",
    q: "What calibers do you stock?",
    a: "[Owner to list the calibers stocked at the desk.] House ammunition is sold at the desk for use on the premises, brass or nickel cased only. If you shoot something unusual, call ahead or bring your own within the rules above.",
  },
  {
    id: "kids",
    q: "Can my kids shoot?",
    a: "Live fire is 18 and over as a house rule; New York State allows supervised shooting from 12, and we review our floor every year. The simulator is 18 and over, or 16 and 17 with a parent or guardian in the bay.",
  },
  {
    id: "simulator",
    q: "What is the simulator?",
    a: "A private bay with a 4K wall and pistols and rifles that recoil but fire only a laser. Plate racks first, then branching judgment scenarios, then an instructor debrief. No live ammunition, no permit, up to four people for an hour.",
  },
  {
    id: "non-shooters",
    q: "Can non-shooters come and watch?",
    a: "Yes. The lounge looks straight onto the line through ballistic glass and each suite has a lounge of its own. Watchers still show ID and sign the acknowledgement at the desk, same as everyone.",
  },
  {
    id: "lounge-noise",
    q: "Can I hear the shooting from the lounge?",
    a: "Muffled, through the ballistic glass. The lanes are baffled and the glass is thick, so you can talk at the table at normal volume and still watch every shot. Phone calls go outside; that is the one rule the lounge has.",
  },
  {
    id: "late",
    q: "What if I am late?",
    a: "Plan to be here 15 minutes early for check-in and the safety briefing. The session ends at its scheduled time whenever you start it. More than 20 minutes late counts as a no-show.",
  },
  {
    id: "pay",
    q: "How do I pay?",
    a: "For now you reserve online and pay at the desk when you arrive. Once online payment goes live you will pay when you reserve, and nothing else about the flow changes. Lane credit from a late cancellation gets applied at the desk.",
  },
  {
    id: "vetting",
    q: "How does membership vetting work and how long does it take?",
    a: "You apply online. We check your ID and license status. A third party runs a background screen with your written authorization. A 20-minute orientation in person, then you activate. Plan on about ten business days. Declined Club and Signature applicants get the screening fee back.",
  },
  {
    id: "license-through-you",
    q: "Can I get a NYC pistol license through you?",
    a: "No. The NYPD License Division issues licenses, on its own timeline. We host the 16-hour classroom and 2-hour live-fire course New York State requires and we are glad to walk you through the steps, but nobody here can speed the process up or promise an outcome.",
  },
  {
    id: "visitors",
    q: "I'm visiting from abroad. Can I shoot?",
    a: "The simulator, yes, with a passport. Live fire depends on your visa status under federal law. Ask the desk before you reserve and you will get a straight answer. [Counsel to confirm.]",
  },
  {
    id: "layover",
    q: "I'm on a layover at JFK. Can I come shoot?",
    a: "Yes, if the layover is long enough. Plan on three hours door to door: five minutes each way by car, fifteen at the desk for ID and the briefing, an hour in the bay, and whatever your terminal takes to clear security again. Watch the Van Wyck after 4 PM. Without a NYC pistol license that hour is the simulator, which is open to anyone 18 and over with a passport. Reserve before you land.",
  },
  {
    id: "luggage",
    q: "Can I bring my luggage?",
    a: "Yes. Bags stay behind the desk while you shoot and nothing bigger than a range bag goes onto the floor. [Owner to confirm the space behind the desk.] Keep your passport on you; the desk asks for it at check-in.",
  },
  {
    id: "out-of-city-permit",
    q: "My pistol permit is from Nassau, Westchester or upstate. Can I bring my handgun?",
    a: "[Answer pending counsel: whether a pistol license issued outside the five boroughs is honored here.] Call the desk before you reserve and bring the license with you. Whatever counsel says about the handgun, the simulator is open to you at 18 with photo ID.",
  },
  {
    id: "cancellation",
    q: "What is the cancellation policy?",
    a: `Cancel free up to ${BOOKING.freeCancelHours} hours before for anything except suites and events, which need ${BOOKING.suiteFreeCancelHours} hours, and the ${COURSE_NAME}, which needs ${COURSE_CANCEL_WINDOW}. Inside the window, half the fee is held as lane credit for 12 months. No-shows forfeit the session. The cancel link is in your confirmation.`,
  },
  {
    id: "phones",
    q: "Can I take photos or video on the line?",
    a: "Of yourself and your party, yes, with the phone on a lanyard or in a pocket. Never film another guest without asking. A range officer will hold your phone while you shoot if you ask.",
  },
  {
    id: "lead",
    q: "Is there a lead exposure risk?",
    a: "Every lane has its own downrange airflow and its own filtration, and house ammunition uses lead-free primers where we can get them. Wash your hands and face before you eat. If you are pregnant or nursing, talk to your doctor first; the simulator has none of this to think about.",
  },
  {
    id: "parking",
    q: "Is there parking?",
    a: "[Owner to confirm on-site spaces.] The club sits on Rockaway Blvd just north of JFK, off the Van Wyck, so most guests drive or take a car from the airport. Rideshares drop at the front door, and the [Q7] bus stops on the boulevard.",
  },
  {
    id: "events",
    q: "Can I host an event?",
    a: "Yes. A Private Suite takes six and the Founders' Suite takes ten, and both reserve online. Anything larger, up to a forty-person buyout, goes through the Events inquiry and a planner replies within one business day.",
  },
  {
    id: "alcohol",
    q: "Is alcohol served?",
    a: "No. The lounge pours espresso, tea and sparkling water. Nothing impairing before or during a session, full stop.",
  },
  {
    id: "food",
    q: "Is there food?",
    a: "Espresso, tea and sparkling water for certain. [Owner to confirm anything to eat beyond that.] Nothing is served on the firing line, and wash your hands before you eat; the lead question above says why.",
  },
];
