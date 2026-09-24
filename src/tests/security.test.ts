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
  it("prefers the explicit URL, then the Replit domains, and never throws", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://thegunspa.com/" })).toBe("https://thegunspa.com");
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "thegunspa.com" })).toBe("https://thegunspa.com");
    expect(resolveSiteUrl({ REPLIT_DOMAINS: "gunspa.replit.app,other.replit.app" })).toBe("https://gunspa.replit.app");
    expect(resolveSiteUrl({ REPLIT_DEV_DOMAIN: "abc.riker.replit.dev" })).toBe("https://abc.riker.replit.dev");
    expect(resolveSiteUrl({})).toBe("http://localhost:5000");
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://[bad" })).toBe("http://localhost:5000");
  });
});
