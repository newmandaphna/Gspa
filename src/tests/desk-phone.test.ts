import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { deskPhone, deskPhoneHref, SITE } from "@/lib/config/site";
import { isPlaceholder } from "@/lib/seo/placeholders";

/**
 * The desk phone helpers behind every "call the desk" line. While site.ts
 * still holds the 000-0000 placeholder they return null and callers fall back
 * to the desk email, so the fake number never reaches a guest. Once the owner
 * sets a real number the same helpers hand back a dialable tel: link.
 */
describe("deskPhone", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/seo/placeholders");
    vi.resetModules();
  });

  it("returns null while the number in site.ts is a placeholder", () => {
    if (isPlaceholder(SITE.phone)) {
      expect(deskPhone()).toBeNull();
      expect(deskPhoneHref()).toBeNull();
    } else {
      expect(deskPhone()).toBe(SITE.phone);
      expect(deskPhoneHref()).toMatch(/^tel:\+?\d+$/);
    }
  });

  it("builds a digits-only tel: link once the number counts as real", async () => {
    vi.doMock("@/lib/seo/placeholders", () => ({ isPlaceholder: () => false }));
    const site = await import("@/lib/config/site");
    expect(site.deskPhone()).toBe(site.SITE.phone);
    expect(site.deskPhoneHref()).toBe(`tel:${site.SITE.phone.replace(/[^\d+]/g, "")}`);
    expect(site.deskPhoneHref()).not.toMatch(/[\s()-]/);
  });

  it("keeps both error boundaries behind the helpers, never SITE.phone directly", () => {
    for (const file of ["src/app/error.tsx", "src/app/global-error.tsx"]) {
      const src = readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");
      expect(src, file).toContain("deskPhone()");
      expect(src, file).toContain("deskPhoneHref()");
      expect(src, file).not.toMatch(/SITE\.phone/);
      expect(src, file).toContain("mailto:${SITE.email}");
    }
  });
});
