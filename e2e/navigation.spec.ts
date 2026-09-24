import { test, expect } from "@playwright/test";

test("class links fit desktop and tablet and select only the schedule", async ({ page }) => {
  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/training/classes");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link", { name: "Training Classes", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Training", exact: true })).not.toHaveAttribute("aria-current");
    await expect(nav.getByRole("link", { name: "Reserve", exact: true })).toHaveAttribute("href", "/reserve");
    await expect(page.getByRole("navigation", { name: "Footer", exact: true }).getByRole("link", { name: "Training Classes" })).toHaveAttribute("href", "/training/classes");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("mobile keyboard navigation closes the menu and restores scrolling and focus", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/training");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.locator("#mobile-menu").getByRole("link", { name: "The Club", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await page.getByRole("button", { name: "Open menu" }).click();
  const classes = page.locator("#mobile-menu").getByRole("link", { name: "Training Classes", exact: true });
  await classes.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/training\/classes$/);
  await expect(page.locator("#mobile-menu")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
  await expect(page.locator("#main")).not.toHaveAttribute("inert");
});