import { test, expect } from "@playwright/test";

test("class links fit desktop and tablet and select only the schedule", async ({ page }) => {
  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/training/classes");
    const nav = page.getByRole("navigation", { name: "Primary" });
    // The classes page sits under Training in the bar; it has no item of its own.
    await expect(nav.getByRole("link", { name: "Training", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Training Classes", exact: true })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Reserve", exact: true })).toHaveAttribute("href", "/reserve");
    await expect(page.getByRole("navigation", { name: "Footer", exact: true }).getByRole("link", { name: "Training Classes" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const links = nav.getByRole("link");
    const boxes = [];
    for (const link of await links.all()) {
      if (!await link.isVisible()) continue;
      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        boxes.push(box);
      }
    }
    for (let i = 0; i < boxes.length; i++) {
      for (const other of boxes.slice(i + 1)) {
        const box = boxes[i];
        const overlap = box.x < other.x + other.width && other.x < box.x + box.width
          && box.y < other.y + other.height && other.y < box.y + box.height;
        expect(overlap, `navigation links overlap at ${width}px`).toBe(false);
      }
    }
  }
});

test("mobile keyboard navigation closes the menu and restores scrolling and focus", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/training");
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  const initialScroll = await page.evaluate(() => scrollY);
  const toggle = page.getByRole("button", { name: "Open menu" });
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#main")).toHaveAttribute("inert", "");
  await expect(page.locator("#site-footer")).toHaveAttribute("inert", "");
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
  await expect(page.locator("#mobile-menu").getByRole("link", { name: "The Club", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-menu")).toHaveCount(0);
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#main")).not.toHaveAttribute("inert");
  await expect(page.locator("#site-footer")).not.toHaveAttribute("inert");
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
  expect(await page.evaluate(() => scrollY)).toBe(initialScroll);
  await page.mouse.move(180, 700);
  await page.mouse.wheel(0, 200);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(initialScroll);
  await page.keyboard.press("Enter");
  await expect(page.locator("#mobile-menu").getByRole("link", { name: "The Club", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#mobile-menu").getByRole("link", { name: "Training", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  const membership = page.locator("#mobile-menu").getByRole("link", { name: "Membership", exact: true });
  await expect(membership).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/membership$/);
  // App Router updates the URL before the destination commits and resets scroll.
  // Wait for both before testing wheel input on the new page.
  await expect(page.getByRole("heading", { name: "Fifty Founders." })).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator("#mobile-menu")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
  await expect(page.locator("#main")).not.toHaveAttribute("inert");
  await expect(page.locator("#site-footer")).not.toHaveAttribute("inert");
  const scrollAfterNavigation = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 200);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrollAfterNavigation);
});