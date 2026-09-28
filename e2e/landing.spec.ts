import { test, expect } from "@playwright/test";

/**
 * Landing-only mode (SITE.landingOnly, on unless LANDING_ONLY=false). The rest
 * of the suite exercises the full site, so run it with LANDING_ONLY=false; this
 * file runs against a default build and skips itself when the mode is off.
 */
test("landing mode shows one page and redirects the rest", async ({ page, request }) => {
  const probe = await request.get("/training", { maxRedirects: 0 });
  test.skip(probe.status() !== 307, "landing mode is off");

  await page.goto("/membership");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("pistol licensees");
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);

  await page.getByLabel("Full name").fill("Landing Test");
  await page.getByLabel("Email").fill("landing@example.com");
  await page.getByLabel("ZIP code").fill("11434");
  await page.getByLabel("NYC pistol license").selectOption("Not yet applied");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Join the list" }).click();
  await expect(page.getByRole("status")).toContainText("on the list");

  const legal = await request.get("/legal", { maxRedirects: 0 });
  expect(legal.status()).toBe(200);
});
