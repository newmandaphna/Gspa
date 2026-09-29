import { test, expect } from "@playwright/test";

test("signup rejects bad phone, email and unassigned ZIP before an intercepted submission", async ({ page }) => {
  const submissions: Array<{ email: string; phone: string; message: string }> = [];
  await page.route("**/api/inquiries", async route => {
    submissions.push(route.request().postDataJSON());
    await route.fulfill({ json: { ok: true, id: 999 } });
  });
  await page.goto("/");
  const name = page.getByLabel("Full name", { exact: true });
  const email = page.getByLabel("Email", { exact: true });
  const phone = page.getByLabel("Phone", { exact: true });
  const zip = page.getByLabel("ZIP code");
  const submit = page.getByRole("button", { name: "Join the list", exact: true });
  await name.fill("Signup Test");
  await email.fill("signup@example.com");
  await zip.fill("00501");
  await page.getByLabel("NYC pistol license", { exact: true }).selectOption("Not yet applied");
  await page.getByRole("checkbox").check();

  await phone.fill("347-ABC-0773");
  await expect(phone).toHaveValue("(347) 077-3");
  await submit.click();
  await expect(page.locator("form").getByRole("alert")).toContainText("valid US phone number");
  expect(submissions).toHaveLength(0);

  await phone.fill("1234567890");
  await submit.click();
  await expect(page.locator("form").getByRole("alert")).toContainText("valid US phone number");
  expect(submissions).toHaveLength(0);

  await phone.fill("");
  await phone.pressSequentially("abc");
  await expect(phone).toHaveValue("");
  await phone.pressSequentially("3478860773");
  await expect(phone).toHaveValue("(347) 886-0773");
  await phone.press("Backspace");
  await expect(phone).toHaveValue("(347) 886-077");
  await phone.pressSequentially("3xyz");
  await expect(phone).toHaveValue("(347) 886-0773");
  await email.fill("a@localhost");
  await submit.click();
  await expect(page.locator("form").getByRole("alert")).toContainText("valid email address");
  expect(submissions).toHaveLength(0);

  await email.fill("signup@example.com");
  await zip.fill("00000");
  await submit.click();
  await expect(page.locator("form").getByRole("alert")).toContainText("assigned US ZIP code");
  expect(submissions).toHaveLength(0);

  await zip.fill("00501");
  await submit.click();
  await expect(page.getByRole("status")).toContainText("on the list");
  expect(submissions).toHaveLength(1);
  expect(submissions[0].phone).toBe("(347) 886-0773");
  expect(submissions[0].message).toContain("ZIP: 00501");
});