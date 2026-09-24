import { expect, test, request, type Locator } from "@playwright/test";
import sharp from "sharp";

// Destructive fixture creation is strictly opt-in and restricted to the isolated test server.
test("isolated scheduled-class enrollment and private documents", async ({ page, browser, baseURL }) => {
  test.skip(process.env.E2E_ISOLATED_CLASSES !== "1", "Requires a disposable PGlite test server.");
  expect(baseURL).toBe("http://127.0.0.1:5001");
  test.setTimeout(120_000);
  const origin = baseURL!;
  const date = "2038-10-06";
  const title = `Isolated training ${Date.now()}`;
  const requestOrigin = process.env.E2E_INTERNAL_ORIGIN || origin;
  const headers = { origin: requestOrigin };
  if (requestOrigin !== origin) {
    test.info().annotations.push({ type: "build-workaround", description: "Origin rewritten for pre-fix Next bind-address mismatch; rerun without E2E_INTERNAL_ORIGIN after rebuild." });
    await page.route("**/api/**", route => route.continue({ headers: { ...route.request().headers(), origin: requestOrigin } }));
  }
  const contact = (name: string) => ({
    firstName: name, lastName: "Fixture", email: `${name.toLowerCase()}@example.com`, phone: "2025550100",
    mailingAddress: { line1: "123 Test Street", city: "Queens", state: "NY", postalCode: "11432", country: "US" },
    attendees: [{ firstName: name, lastName: "Fixture" }], ackRequirements: true,
  });
  const fillContact = async (form: Locator, name: string) => {
    for (const [label, value] of Object.entries({
      "First name": name, "Last name": "Fixture", Email: `${name.toLowerCase()}@example.com`, Phone: "2025550100",
      "Address line 1": "123 Test Street", City: "Queens", State: "NY", "Postal code": "11432", Country: "US",
    })) await form.getByLabel(label, { exact: true }).fill(value);
  };
  await page.goto("/training/classes");
  await expect(page.getByRole("heading", { name: "Pick a date, hold a seat." })).toBeVisible();
  await page.goto("/admin/classes");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Admin password").fill("isolated-test-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  // Production auth uses Secure cookies. Chromium trusts loopback HTTP, but
  // APIRequestContext does not; explicitly forward this isolated test cookie.
  const admin = await request.newContext({ extraHTTPHeaders: {
    cookie: (await page.context().cookies()).map(c => `${c.name}=${c.value}`).join("; "),
  } });
  await page.goto("/admin/classes");
  await page.getByRole("button", { name: "Add class", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add class", exact: true });
  await dialog.getByRole("combobox", { name: "Experience", exact: true }).selectOption("nys-ccw-course");
  await dialog.getByLabel("Class title", { exact: true }).fill(title);
  await dialog.getByLabel("Date", { exact: true }).fill(date);
  await dialog.getByLabel("End date", { exact: true }).fill(date);
  await dialog.getByLabel("Capacity", { exact: true }).fill("2");
  await dialog.getByLabel("Instructor", { exact: true }).fill("Test instructor");
  await dialog.getByLabel("Requirements", { exact: true }).fill("Test requirements");
  await dialog.getByLabel("Staff notes (not public)", { exact: true }).fill("Synthetic test");
  await dialog.getByRole("combobox", { name: "Status", exact: true }).selectOption("open");
  await dialog.getByRole("button", { name: "Save class", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const listing = await admin.get(`${origin}/api/admin/classes`);
  expect(listing.ok()).toBe(true);
  const session = (await listing.json()).sessions.find((s: { title: string }) => s.title === title);
  expect(session).toBeTruthy();

  const guest = await browser.newContext({ baseURL: origin });
  if (requestOrigin !== origin) await guest.route("**/api/**", route => route.continue({ headers: { ...route.request().headers(), origin: requestOrigin } }));
  const publicPage = await guest.newPage();
  await publicPage.goto("/training/classes");
  await publicPage.getByLabel("Class date").fill(date);
  await publicPage.getByRole("button").filter({ hasText: title }).click();
  const enrollment = publicPage.locator("aside form");
  await fillContact(enrollment, "Public");
  await enrollment.getByLabel("I acknowledge the class requirements above.").check();
  await enrollment.getByRole("button", { name: "Reserve seat", exact: true }).click();
  await expect(publicPage).toHaveURL(/\/reserve\/confirmation\/GS-/);
  await publicPage.screenshot({ path: "e2e/screenshots/classes-confirmation.png", fullPage: true });

  await page.goto(`/admin/classes/${session.id}`);
  const addEnrollment = page.getByRole("button", { name: "Add enrollment", exact: true });
  if (await addEnrollment.count()) {
    await addEnrollment.click();
    const staff = page.getByRole("dialog", { name: "Add staff enrollment" });
    await fillContact(staff, "Staff");
    await staff.getByRole("button", { name: "Add enrollment", exact: true }).click();
    await expect(staff).not.toBeVisible();
  } else {
    test.info().annotations.push({ type: "build-gap", description: "Running build lacks staff enrollment UI; verified manual enrollment API instead." });
    const added = await admin.post(`${origin}/api/admin/classes/${session.id}/enroll`, {
      headers, data: { ...contact("Staff"), recordPayment: "pay_on_arrival" },
    });
    expect(added.ok()).toBe(true);
    await page.reload();
  }
  await expect(page.getByText("public@example.com", { exact: false })).toBeVisible();
  await expect(page.getByText("staff@example.com", { exact: false })).toBeVisible();
  await expect(page.getByText("123 Test Street", { exact: false })).toHaveCount(2);
  await page.screenshot({ path: "e2e/screenshots/classes-roster.png", fullPage: true });
  await publicPage.goto("/training/classes");
  await publicPage.getByLabel("Class date").fill(date);
  const card = publicPage.getByRole("button").filter({ hasText: title });
  await expect(card).toContainText("Sold out");
  await card.click();
  await expect(publicPage.getByRole("button", { name: "Reserve seat", exact: true })).toBeDisabled();
  const conflict = await guest.request.post(`${origin}/api/classes/enroll`, {
    headers, multipart: { payload: JSON.stringify({ ...contact("Excess"), sessionId: session.id }) },
  });
  expect(conflict.status()).toBe(409);
  const roster = await (await admin.get(`${origin}/api/admin/classes/${session.id}`)).json();
  const bookingId = roster.roster[0].booking.id;
  const cancelled = await admin.post(`${origin}/api/admin/classes/${session.id}/bookings/${bookingId}`, {
    headers, data: { action: "cancel" },
  });
  expect(cancelled.ok()).toBe(true);
  const restored = await (await admin.get(`${origin}/api/admin/classes/${session.id}`)).json();
  expect(restored.session.seatsRemaining).toBe(1);

  const documentSession = await admin.post(`${origin}/api/admin/classes`, {
    headers, data: { experienceSlug: "nys-ccw-course", title: `${title} documents`, date, endDate: date,
      startTime: "13:00", endTime: "14:00", priceCents: 0, capacity: 2, maxPerBooking: 1,
      status: "open", collectId: true, requirements: "Test-only image, not identity data" },
  });
  expect(documentSession.ok()).toBe(true);
  const documentId = (await documentSession.json()).session.id;
  const image = await sharp({ create: { width: 32, height: 32, channels: 3, background: "#cccccc" } }).png().toBuffer();
  const uploaded = await guest.request.post(`${origin}/api/classes/enroll`, {
    headers, multipart: {
      payload: JSON.stringify({ ...contact("Document"), sessionId: documentId, documentConsent: true }),
      document_0: { name: "synthetic.png", mimeType: "image/png", buffer: image },
    },
  });
  expect(uploaded.ok()).toBe(true);
  const documents = await (await admin.get(`${origin}/api/admin/classes/${documentId}`)).json();
  const privateId = documents.roster[0].documents[0].id;
  const documentUrl = `${origin}/api/admin/class-documents/${privateId}`;
  expect((await guest.request.get(documentUrl)).status()).toBe(401);
  const retrieved = await admin.get(documentUrl);
  expect(retrieved.ok()).toBe(true);
  expect(retrieved.headers()["content-type"]).toContain("image/jpeg");
  expect((await retrieved.body()).length).toBeGreaterThan(0);
  expect((await admin.delete(documentUrl, { headers })).ok()).toBe(true);
  expect((await admin.get(documentUrl)).status()).toBe(404);
  await admin.dispose();
  await guest.close();
});