import { test, expect } from "@playwright/test";

test.describe("Public routes (unauthenticated)", () => {
  test("register and ECG upload pages load without auth redirect", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("heading", { name: "Patient registration" })).toBeVisible();

    await page.goto("/ecg-upload");
    await expect(page).toHaveURL(/\/ecg-upload$/);
    await expect(page.getByRole("heading", { name: "Upload ECG" })).toBeVisible();
  });
});
