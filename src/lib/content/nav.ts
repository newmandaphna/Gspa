export type NavItem = { label: string; href: string };
export const TRAINING_CLASSES_LINK: NavItem = { label: "Training Classes", href: "/training/classes" };

/** Match the most specific destination so nested routes do not select two links. */
export function isNavActive(pathname: string, href: string): boolean {
  return (pathname === href || pathname.startsWith(href + "/")) &&
    !NAV.some((item) => item.href.startsWith(href + "/") &&
      (pathname === item.href || pathname.startsWith(item.href + "/")));
}

/** The house rules page. The footer, the club page and the legal page all point here. */
export const HOUSE_RULES_LINK: NavItem = { label: "House rules", href: "/house-rules" };

/** Primary navigation (order matters). Edit here to rename or reorder. */
export const NAV: NavItem[] = [
  { label: "The Club", href: "/club" },
  { label: "Training", href: "/training" },
  TRAINING_CLASSES_LINK,
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
      TRAINING_CLASSES_LINK,
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
      HOUSE_RULES_LINK,
      { label: "Acknowledgement", href: "/legal#waiver" },
      { label: "Terms", href: "/legal#terms" },
      { label: "Membership agreement", href: "/legal#membership-agreement" },
      { label: "Privacy", href: "/legal#privacy" },
    ],
  },
];
