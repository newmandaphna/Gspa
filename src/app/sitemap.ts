import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config/site";

/**
 * When each route's content last changed, as an ISO date. Bump a route's
 * date when its copy or layout changes; a build no longer restamps every URL
 * with the build time, so crawlers can tell a changed page from an unchanged
 * one. The site went live on 2026-09-24.
 */
const LAST_MODIFIED: Record<string, string> = {
  "/": "2026-09-24",
  "/club": "2026-09-24",
  "/training": "2026-09-24",
  "/membership": "2026-09-24",
  "/events": "2026-09-24",
  "/visit": "2026-09-24",
  "/reserve": "2026-09-24",
  "/house-rules": "2026-09-24",
  "/legal": "2026-09-24",
};

type Route = [path: string, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"], priority: number];

const ROUTES: Route[] = [
  ["/", "weekly", 1],
  ["/club", "monthly", 0.9],
  ["/training", "monthly", 0.8],
  ["/membership", "monthly", 0.9],
  ["/events", "monthly", 0.7],
  ["/visit", "monthly", 0.8],
  ["/reserve", "daily", 0.9],
  ["/house-rules", "yearly", 0.5],
  ["/legal", "yearly", 0.2],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");
  return ROUTES.map(([path, changeFrequency, priority]) => ({
    url: `${base}${path}`,
    lastModified: new Date(`${LAST_MODIFIED[path]}T00:00:00-04:00`),
    changeFrequency,
    priority,
  }));
}
