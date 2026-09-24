import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signAdminSession, verifyAdminSession } from "@/lib/admin-session";
import { resolveSiteUrl } from "@/lib/config/site";
import { safeNext } from "@/lib/members/safe-next";
import { clientIp } from "@/lib/ratelimit";

const headers = (h: Record<string, string>) => ({ get: (k: string) => h[k.toLowerCase()] ?? null });

describe("admin session tokens", () => {
  const saved = { SESSION_SECRET: process.env.SESSION_SECRET, ADMIN_PASSWORD: process.env.ADMIN_PASSWORD };
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret";
    process.env.ADMIN_PASSWORD = "hunter22";
  });
  afterEach(() => {
    process.env.SESSION_SECRET = saved.SESSION_SECRET;
    process.env.ADMIN_PASSWORD = saved.ADMIN_PASSWORD;
  });

  it("expire, differ per login and reject tampering", () => {
    const t = signAdminSession(1_000_000, 3600);
    expect(verifyAdminSession(t, 1_000_100)).toBe(true);
    expect(verifyAdminSession(t, 1_003_601)).toBe(false);
    expect(verifyAdminSession(t.slice(0, -2) + "zz", 1_000_100)).toBe(false);
    expect(verifyAdminSession("garbage", 1)).toBe(false);
    expect(verifyAdminSession(undefined, 1)).toBe(false);
    expect(signAdminSession(1_000_000, 3600)).not.toBe(signAdminSession(1_000_001, 3600));
  });

  it("falls back to a key derived from ADMIN_PASSWORD, not the raw password", () => {
    delete process.env.SESSION_SECRET;
    const t = signAdminSession(1_000_000, 3600);
    expect(verifyAdminSession(t, 1_000_100)).toBe(true);
    process.env.ADMIN_PASSWORD = "different";
    expect(verifyAdminSession(t, 1_000_100)).toBe(false);
  });
});

describe("safeNext", () => {
  it("accepts only same-origin paths", () => {
    expect(safeNext("/members/account?x=1")).toBe("/members/account?x=1");
    expect(safeNext("/reserve")).toBe("/reserve");
    expect(safeNext("//evil.example/reset")).toBe("/members");
    expect(safeNext("/\\evil.example")).toBe("/members");
    expect(safeNext("\\/evil.example")).toBe("/members");
    expect(safeNext("https://evil.example")).toBe("/members");
    expect(safeNext("")).toBe("/members");
    expect(safeNext(null)).toBe("/members");
    expect(safeNext("/reserve#frag")).toBe("/reserve");
  });
});

describe("clientIp", () => {
  it("trusts the entry the edge appended, never the client-supplied left-most one", () => {
    expect(clientIp(headers({ "x-forwarded-for": "10.0.0.7, 203.0.113.9" }))).toBe("203.0.113.9");
    expect(clientIp(headers({ "x-forwarded-for": "203.0.113.9" }))).toBe("203.0.113.9");
    expect(clientIp(headers({ "x-real-ip": "10.0.0.7" }))).toBe("anon");
    expect(clientIp(headers({}))).toBe("anon");
    process.env.TRUSTED_PROXY_HOPS = "2";
    expect(clientIp(headers({ "x-forwarded-for": "10.0.0.7, 203.0.113.9, 198.51.100.1" }))).toBe("203.0.113.9");
    delete process.env.TRUSTED_PROXY_HOPS;
  });
});

describe("resolveSiteUrl", () => {
  it("in development prefers the explicit URL, then the workspace domain, then localhost, and never throws", () => {
    const dev = { NODE_ENV: "development" };
    expect(resolveSiteUrl({ ...dev, NEXT_PUBLIC_SITE_URL: "https://staging.gunspa.com/" })).toBe("https://staging.gunspa.com");
    expect(resolveSiteUrl({ ...dev, NEXT_PUBLIC_SITE_URL: "staging.gunspa.com" })).toBe("https://staging.gunspa.com");
    expect(resolveSiteUrl({ ...dev, NEXT_PUBLIC_SITE_URL: "http://localhost:5000" })).toBe("http://localhost:5000");
    expect(resolveSiteUrl({ ...dev, REPLIT_DEV_DOMAIN: "efcb4e1b-00-383xumqdxm5dm.worf.replit.dev" })).toBe("https://efcb4e1b-00-383xumqdxm5dm.worf.replit.dev");
    expect(resolveSiteUrl(dev)).toBe("http://localhost:5000");
    expect(resolveSiteUrl({ NODE_ENV: "test" })).toBe("http://localhost:5000");
    expect(resolveSiteUrl({ ...dev, NEXT_PUBLIC_SITE_URL: "http://[bad" })).toBe("http://localhost:5000");
  });

  it("uses the canonical domain for every production build, whatever the build host exposes", () => {
    // Replit's deployment builder renders the sitemap, robots file and Open Graph tags at build time
    // with an environment that is not the workspace's. Only the canonical domain or a real public
    // override may win there; a build-host token must never ship.
    expect(resolveSiteUrl({ NODE_ENV: "production" })).toBe("https://gunspa.com");
    expect(resolveSiteUrl({})).toBe("https://gunspa.com");
    expect(resolveSiteUrl({ NODE_ENV: "production", REPLIT_DOMAINS: "0hdm0b8.y_", REPLIT_DEV_DOMAIN: "0hdm0b8.y_" })).toBe("https://gunspa.com");
    expect(resolveSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "0hdm0b8.y_" })).toBe("https://gunspa.com");
    expect(resolveSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://0hdm0b8.y_" })).toBe("https://gunspa.com");
    expect(resolveSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://www.gunspa.com" })).toBe("https://www.gunspa.com");
    expect(resolveSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "gspa-newmandaphna.replit.app" })).toBe("https://gspa-newmandaphna.replit.app");
    expect(resolveSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "http://[bad" })).toBe("https://gunspa.com");
  });
});
