import { expect, test } from "@playwright/test";

const session = (id: number, overrides = {}) => ({
  id, title: `Public class ${id}`, experienceName: "Instruction",
  startsAt: `2099-01-0${id}T15:00:00Z`, endsAt: `2099-01-0${id}T17:00:00Z`,
  priceCents: 0, maxPerBooking: 2, status: "open", instructor: null,
  requirements: "Bring identification.", collectId: false, seatsRemaining: 2, ...overrides,
});
const payload = { sessions: [session(4), session(2, { priceCents: 5000 }), session(1), session(3, { status: "closed" }), session(5, { status: "cancelled" })], paymentsEnabled: false, documentsEnabled: false };

for (const width of [1280, 390]) {
  test(`homepage classes and exact deep links at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/classes*", route => route.fulfill({ json: payload }));
    await page.goto("/");
    const section = page.locator("#upcoming-classes");
    await expect(section.getByRole("heading", { level: 3 })).toHaveText(["Public class 1", "Public class 2", "Public class 3"]);
    await expect(section.getByText("Free", { exact: true })).toHaveCount(2);
    await expect(section.getByText("$50.00 per person")).toBeVisible();
    await expect(section.getByText("Enrollment closed")).toBeVisible();
    await section.getByRole("link", { name: "View class", exact: true }).first().click();
    await expect(page).toHaveURL(/session=2/);
    await expect(page.locator("aside h2")).toHaveText("Public class 2");
    await expect(page.getByRole("button", { name: "Continue to payment" })).toBeDisabled();
    await page.goto("/training/classes?session=999");
    await expect(page.getByText("This class is unavailable.", { exact: false })).toBeVisible();
    await expect(page.locator("aside form")).toHaveCount(0);
    await page.getByRole("button").filter({ has: page.getByRole("heading", { name: "Public class 1", exact: true }) }).click();
    await expect(page.locator("aside h2")).toHaveText("Public class 1");
    await expect(page.getByText("This class is unavailable.", { exact: false })).toHaveCount(0);
    await page.getByLabel("Class date", { exact: true }).fill("2099-01-02");
    await expect(page).not.toHaveURL(/session=/);
    await expect(page.locator("aside form")).toHaveCount(0);
  });
}

test("homepage loading, error retry, empty and focus refresh remain distinct", async ({ page }) => {
  let mode = "loading";
  await page.route("**/api/classes*", async route => {
    if (mode === "loading") await new Promise(resolve => setTimeout(resolve, 1000));
    await route.fulfill(mode === "error" || mode === "loading" ? { status: 503, json: { error: "Unavailable" } } : { json: { ...payload, sessions: mode === "empty" ? [] : payload.sessions } });
  });
  await page.goto("/");
  const section = page.locator("#upcoming-classes");
  await expect(section.getByRole("status")).toHaveText("Loading upcoming classes…");
  await expect(section.getByRole("alert")).toBeVisible();
  await expect(section.getByText("New class dates are coming soon.")).toHaveCount(0);
  mode = "empty";
  await section.getByRole("button", { name: "Try again" }).click();
  await expect(section.getByText("New class dates are coming soon.")).toBeVisible();
  await expect(section.getByRole("link", { name: "View full class schedule" })).toBeVisible();
  mode = "ready";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(section.getByRole("heading", { level: 3 })).toHaveCount(3);
});