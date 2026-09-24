import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");
  const now = new Date();
  const routes: Array<[string, MetadataRoute.Sitemap[number]["changeFrequency"], number]> = [
    ["/", "weekly", 1],
    ["/club", "monthly", 0.9],
    ["/training", "monthly", 0.8],
    ["/membership", "monthly", 0.9],
    ["/events", "monthly", 0.7],
    ["/visit", "monthly", 0.8],
    ["/reserve", "daily", 0.9],
    ["/legal", "yearly", 0.2],
  ];
  return routes.map(([path, changeFrequency, priority]) => ({ url: `${base}${path}`, lastModified: now, changeFrequency, priority }));
}
