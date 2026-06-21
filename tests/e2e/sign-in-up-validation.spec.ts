import { test, expect } from "@playwright/test";

test.describe("Sign-in / sign-up HTML validation", () => {
  test("sign-in requires email and password before submit", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByLabel("Email")).toHaveJSProperty("validity.valueMissing", true);
  });

  test("sign-up requires name, email, and password before submit", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByLabel("Full name")).toHaveJSProperty("validity.valueMissing", true);
  });

  test("sign-up rejects malformed email format", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByLabel("Full name").fill("E2E User");
    await page.getByLabel("Work email").fill("not-an-email");
    await page.getByLabel("Password").fill("password12");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByLabel("Work email")).toHaveJSProperty("validity.typeMismatch", true);
  });
});
