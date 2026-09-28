import { describe, expect, it } from "vitest";
import { landingRedirects } from "@/lib/landing";

describe("landing-only mode paths", () => {
  it("keeps the sign-up and privacy pages", () => {
    expect(landingRedirects("/")).toBe(false);
    expect(landingRedirects("/legal")).toBe(false);
  });

  it("sends every other page to the sign-up", () => {
    for (const path of ["/training", "/membership", "/events", "/visit", "/reserve", "/reserve/manage", "/house-rules", "/club", "/members/login", "/training/classes", "/lab"]) {
      expect(landingRedirects(path), path).toBe(true);
    }
  });

  it("leaves the desk, the APIs, framework files and assets alone", () => {
    for (const path of ["/admin", "/admin/login", "/admin/inquiries", "/api/inquiries", "/_next/static/chunk.js", "/robots.txt", "/sitemap.xml", "/icon.png", "/renders/casings.webp", "/opengraph-image", "/apple-icon.png"]) {
      expect(landingRedirects(path), path).toBe(false);
    }
  });
});
