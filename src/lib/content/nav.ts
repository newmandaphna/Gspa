export type NavItem = { label: string; href: string };

/** Primary navigation (order matters). Edit here to rename or reorder. */
export const NAV: NavItem[] = [
  { label: "Range", href: "/range" },
  { label: "Training", href: "/training" },
  { label: "Membership", href: "/membership" },
  { label: "Events", href: "/events" },
  { label: "Visit", href: "/visit" },
];

export const FOOTER_COLUMNS: { title: string; links: NavItem[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "The Range", href: "/range" },
      { label: "Private Suites", href: "/range#suites" },
      { label: "Training", href: "/training" },
      { label: "Membership", href: "/membership" },
      { label: "Private Events", href: "/events" },
    ],
  },
  {
    title: "Reserve",
    links: [
      { label: "Reserve a lane", href: "/reserve" },
      { label: "Book a class", href: "/reserve?category=training" },
      { label: "Manage a reservation", href: "/reserve/manage" },
      { label: "Plan an event", href: "/events#inquire" },
    ],
  },
  {
    title: "Visit",
    links: [
      { label: "Hours & directions", href: "/visit" },
      { label: "Requirements", href: "/visit#requirements" },
      { label: "FAQ", href: "/visit#faq" },
      { label: "Contact", href: "/visit#contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Range rules", href: "/legal/range-rules" },
      { label: "Waiver", href: "/legal/waiver" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
    ],
  },
];
