import { FACILITY, HOURS, SITE } from "@/lib/config/site";
import { CATALOG, CATEGORY_LABELS, itemBySlug, type CatalogItem } from "@/lib/content/catalog";
import type { Faq } from "@/lib/content/faq";
import { isPlaceholder, stripPlaceholders } from "@/lib/seo/placeholders";

/**
 * Structured data for search engines. Every fact here is read from
 * src/lib/config/site.ts and src/lib/content/*; nothing is typed in twice.
 * Values the owner has not confirmed (a bracket, the 000-0000 phone) are left
 * out of the record rather than published.
 */

type JsonLd = Record<string, unknown>;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

function origin(): string {
  return SITE.url.replace(/\/$/, "");
}

export function businessId(): string {
  return `${origin()}/#business`;
}

function dollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * HOURS (site.ts) grouped into OpeningHoursSpecification entries, one per
 * distinct open-to-close pair, so Monday to Friday collapse into a single row.
 */
export function openingHoursSpecification(): JsonLd[] {
  const groups = new Map<string, number[]>();
  for (let dow = 0; dow < 7; dow++) {
    const h = HOURS[dow];
    if (!h) continue;
    const key = `${h.open}-${h.close}`;
    groups.set(key, [...(groups.get(key) ?? []), dow]);
  }
  return [...groups.entries()].map(([key, days]) => {
    const [opens, closes] = key.split("-");
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days.map((d) => DAY_NAMES[d]),
      opens,
      closes,
    };
  });
}

/** The public offers: one per bookable catalog item, priced from priceCents. */
export function offers(): JsonLd[] {
  return CATALOG.filter((item) => item.bookable && !item.memberOnly && item.priceCents > 0).map((item) => offerFor(item));
}

function offerFor(item: CatalogItem): JsonLd {
  return {
    "@type": "Offer",
    name: item.name,
    description: stripPlaceholders(item.tagline),
    price: dollars(item.priceCents),
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: `${origin()}/reserve?experience=${item.slug}`,
    itemOffered: {
      "@type": "Service",
      name: item.name,
      serviceType: CATEGORY_LABELS[item.category],
      provider: { "@id": businessId() },
    },
  };
}

/** "$75 to $1400": the cheapest and dearest bookable unit, from the catalog. */
function priceRange(): string | undefined {
  const prices = CATALOG.filter((i) => i.bookable && i.priceCents > 0).map((i) => i.priceCents);
  if (prices.length === 0) return undefined;
  const lo = Math.min(...prices) / 100;
  const hi = Math.max(...prices) / 100;
  return `$${lo} to $${hi}`;
}

/**
 * The club as a LocalBusiness and SportsActivityLocation. Injected on every
 * page from layout.tsx. Telephone and geo are added only once the owner
 * confirms them (the phone in site.ts is still 000-0000).
 */
export function localBusinessJsonLd(): JsonLd {
  const base = origin();
  const record: JsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "SportsActivityLocation"],
    "@id": businessId(),
    name: SITE.name,
    alternateName: SITE.shortName,
    slogan: SITE.tagline,
    description: SITE.description,
    url: base,
    image: `${base}/opengraph-image`,
    logo: `${base}/icon.png`,
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.line1,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.state,
      postalCode: SITE.address.zip,
      addressCountry: "US",
    },
    hasMap: SITE.address.googleMapsUrl,
    openingHoursSpecification: openingHoursSpecification(),
    sameAs: Object.values(SITE.social),
    currenciesAccepted: "USD",
    paymentAccepted: "Credit card",
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Lounge behind ballistic glass", value: true },
      { "@type": "LocationFeatureSpecification", name: `${FACILITY.simulatorBays} simulator bays`, value: true },
      { "@type": "LocationFeatureSpecification", name: `${FACILITY.suites} private suites`, value: true },
      { "@type": "LocationFeatureSpecification", name: `${FACILITY.laneCount} lanes at ${FACILITY.laneYards} yards`, value: true },
    ],
    potentialAction: {
      "@type": "ReserveAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/reserve`, actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"] },
      result: { "@type": "Reservation", name: "Lane, suite, simulator or instructor reservation" },
    },
    makesOffer: offers(),
  };
  if (!isPlaceholder(SITE.phone)) record.telephone = SITE.phone;
  const range = priceRange();
  if (range) record.priceRange = range;
  return record;
}

/**
 * FAQPage for /visit. Answers that still hold an owner placeholder are left
 * out, so a bracket never reaches a search result.
 */
export function faqJsonLd(items: readonly Faq[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${origin()}/visit#faq`,
    mainEntity: items
      .filter((f) => !isPlaceholder(f.a) && !isPlaceholder(f.q))
      .map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
  };
}

/** Course for the New York State 18-hour course on /training. Null if the catalog no longer lists it. */
export function courseJsonLd(): JsonLd | null {
  const course = itemBySlug("nys-ccw-course");
  if (!course) return null;
  const base = origin();
  const record: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${base}/training#course`,
    name: course.name,
    description: stripPlaceholders(course.description),
    url: `${base}/training`,
    provider: { "@type": "Organization", name: SITE.name, url: base, sameAs: base },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Onsite",
      courseWorkload: `PT${Math.round(course.durationMin / 60)}H`,
      location: { "@id": businessId() },
    },
  };
  if (course.priceCents > 0) {
    record.offers = {
      "@type": "Offer",
      price: dollars(course.priceCents),
      priceCurrency: "USD",
      category: "Paid",
      url: `${base}/training`,
    };
  }
  return record;
}

/** The JSON text for a script tag. "<" is escaped so content can never close the tag. */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
