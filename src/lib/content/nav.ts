export type NavItem = { label: string; href: string };

/** Primary navigation (order matters). Edit here to rename or reorder. */
export const NAV: NavItem[] = [
  { label: "The Club", href: "/club" },
  { label: "Training", href: "/training" },
  { label: "Membership", href: "/membership" },
  { label: "Events", href: "/events" },
  { label: "Visit", href: "/visit" },
];

export const FOOTER_COLUMNS: { title: string; links: NavItem[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "The Club", href: "/club" },
      { label: "Private Suites", href: "/club#suites" },
      { label: "Simulator", href: "/club#simulator" },
      { label: "Training", href: "/training" },
      { label: "Membership", href: "/membership" },
      { label: "Events", href: "/events" },
    ],
  },
  {
    title: "Reserve",
    links: [
      { label: "Reserve a lane", href: "/reserve?category=lane" },
      { label: "Reserve a suite", href: "/reserve?category=suite" },
      { label: "Reserve training", href: "/reserve?category=training" },
      { label: "Manage a reservation", href: "/reserve/manage" },
      { label: "Plan an event", href: "/events#inquire" },
    ],
  },
  {
    title: "Members",
    links: [
      { label: "Sign in", href: "/members/login" },
      { label: "Activate your account", href: "/members/activate" },
      { label: "Compare tiers", href: "/membership#tiers" },
      { label: "Apply", href: "/membership#apply" },
    ],
  },
  {
    title: "Visit",
    links: [
      { label: "Hours and directions", href: "/visit" },
      { label: "Requirements", href: "/visit#requirements" },
      { label: "FAQ", href: "/visit#faq" },
      { label: "Contact", href: "/visit#contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Range rules", href: "/legal#range-rules" },
      { label: "Acknowledgement", href: "/legal#waiver" },
      { label: "Terms", href: "/legal#terms" },
      { label: "Membership agreement", href: "/legal#membership-agreement" },
      { label: "Privacy", href: "/legal#privacy" },
    ],
  },
];
