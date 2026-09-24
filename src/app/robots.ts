import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  const base = SITE.url.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/members", "/api", "/reserve/confirmation", "/reserve/manage"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
