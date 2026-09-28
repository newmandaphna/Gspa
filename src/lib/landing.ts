/**
 * Landing-only mode (SITE.landingOnly): which paths the public may still
 * reach. Pure, so it is unit-tested; src/proxy.ts applies it.
 */

/** Pages the public sees in landing mode: the sign-up and the privacy policy it links to. */
export const LANDING_PAGES = ["/", "/legal"] as const;

/** Prefixes never redirected: the desk, the APIs the form and the desk use, framework files and metadata images. */
const PASS_PREFIXES = ["/admin", "/api/", "/_next/", "/opengraph-image", "/twitter-image", "/icon", "/apple-icon"];

/** True when a request for this path should be sent to "/" instead. */
export function landingRedirects(pathname: string): boolean {
  if ((LANDING_PAGES as readonly string[]).includes(pathname)) return false;
  if (PASS_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) return false;
  // Files: robots.txt, sitemap.xml, renders, fonts, images.
  if (/\/[^/]+\.[a-z0-9]+$/i.test(pathname)) return false;
  return true;
}
