import { test, expect } from "@playwright/test";

test("Other requires an explanation and includes it in the signup without writing real data", async ({ page }) => {
  let submitted: { message: string } | undefined;
  await page.route("**/api/inquiries", async route => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ json: { ok: true, id: 999 } });
  });
  await page.goto("/");
  await page.getByLabel("Full name", { exact: true }).fill("Signup Test");
  await page.getByLabel("Email", { exact: true }).fill("signup@example.invalid");
  await page.getByLabel("ZIP code").fill("10001");
  await page.getByLabel("NYC pistol license", { exact: true }).selectOption("Not yet applied");
  await page.getByRole("checkbox").check();
  const explanation = page.getByLabel("Please tell us how you heard about us");
  await expect(explanation).toHaveCount(0);
  await page.getByLabel("How you heard about us", { exact: true }).selectOption("Other");
  await expect(explanation).toBeVisible();
  await page.getByRole("button", { name: "Join the list", exact: true }).click();
  expect(submitted).toBeUndefined();
  await explanation.fill("   ");
  await page.getByRole("button", { name: "Join the list", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("Please tell us");
  expect(submitted).toBeUndefined();
  await explanation.fill("  Neighborhood flyer  ");
  await page.getByLabel("How you heard about us", { exact: true }).selectOption("Search");
  await expect(explanation).toHaveCount(0);
  await page.getByLabel("How you heard about us", { exact: true }).selectOption("Other");
  await page.getByRole("button", { name: "Join the list", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("on the list");
  expect(submitted?.message).toContain("Heard via: Other: Neighborhood flyer");
});