import { expect, test, type Page } from "@playwright/test";

/**
 * Smoke test + screenshot pass. Run with `npm run e2e` after `npm run build`.
 * Screenshots land in e2e/screenshots (git-ignored) for visual review.
 */

const PAGES = ["/", "/club", "/training", "/membership", "/events", "/visit", "/reserve", "/members/login", "/members/activate", "/reserve/manage", "/legal", "/admin/login"];

async function collectErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
}

for (const path of PAGES) {
  test(`renders ${path} without errors`, async ({ page }) => {
    const errors = await collectErrors(page);
    const res = await page.goto(path);
    expect(res?.status(), `${path} status`).toBeLessThan(400);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
    // Walk the page so scroll-reveal sections render in the full-page capture.
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = "auto";
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y < h; y += 400) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 100));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.waitForTimeout(1200);
    // Accept font/network noise, fail on real runtime errors.
    const real = errors.filter((e) => !/fonts\.g|net::ERR|favicon|hydrat/i.test(e));
    expect(real, `${path} errors`).toEqual([]);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: `e2e/screenshots${path === "/" ? "/home" : path.replace(/\//g, "_")}-desktop.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `e2e/screenshots${path === "/" ? "/home" : path.replace(/\//g, "_")}-mobile.png`, fullPage: true });
  });
}

test("books a lane end to end (pay on arrival)", async ({ page }) => {
  test.skip(Boolean(process.env.STRIPE_SECRET_KEY), "Stripe enabled: checkout redirect is external");
  await page.goto("/reserve");
  // Step 1: first bookable card
  await page.getByRole("tab", { name: "Lanes" }).click();
  await page.locator("li button").first().click();
  // Step 2: pick a date at least two days out, then the first enabled slot
  await expect(page.getByRole("heading", { name: "When?" })).toBeVisible();
  const enabledDays = page.locator('[role="gridcell"] button:not([disabled])');
  const count = await enabledDays.count();
  await enabledDays.nth(Math.min(2, count - 1)).click();
  const slot = page.locator('[role="option"]:not([disabled])').first();
  await expect(slot).toBeVisible({ timeout: 15_000 });
  await slot.click();
  await page.getByRole("button", { name: "Continue" }).click();
  // Step 3: details
  await page.fill("#firstName", "Play");
  await page.fill("#lastName", "Wright");
  await page.fill("#email", "playwright@example.com");
  await page.fill("#phone", "718 555 0100");
  await page.check('input[type="checkbox"]');
  await page.getByRole("button", { name: /Confirm reservation/ }).click();
  await expect(page).toHaveURL(/\/reserve\/confirmation\/GS-/, { timeout: 20_000 });
  await expect(page.getByText("Confirmation code")).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: "e2e/screenshots/confirmation-desktop.png", fullPage: true });
});

test("member portal redirects anonymous visitors to sign in", async ({ page }) => {
  await page.goto("/members");
  await expect(page).toHaveURL(/\/members\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});
