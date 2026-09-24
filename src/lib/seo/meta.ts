import type { Metadata } from "next";
import { SITE } from "@/lib/config/site";

/**
 * Page metadata with a canonical URL and an Open Graph url for one route.
 *
 * Next resolves the relative paths against metadataBase (SITE.url, set in
 * layout.tsx), so the same export works on the Replit preview domain and on
 * gunspa.com. openGraph in a page replaces the layout's openGraph rather than
 * merging with it, so the site name, type and locale are restated here; the
 * title and description are inherited from the page's own fields.
 */
export function pageMeta(path: string, meta: Metadata): Metadata {
  const canonical = path === "/" ? "/" : path.replace(/\/$/, "");
  return {
    ...meta,
    alternates: { ...meta.alternates, canonical },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: "en_US",
      ...meta.openGraph,
      url: canonical,
    },
  };
}
