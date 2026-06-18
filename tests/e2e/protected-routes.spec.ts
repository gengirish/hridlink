import { test, expect } from "@playwright/test";

test.describe("Protected routes (unauthenticated)", () => {
  test("redirects /admin to sign-in", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("redirects /cardiologist to sign-in", async ({ page }) => {
    await page.goto("/cardiologist");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
