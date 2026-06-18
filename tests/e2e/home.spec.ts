import { test, expect } from "@playwright/test";

test.describe("Home", () => {
  test("shows HridLink title and primary navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "HridLink", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Quick Access" })).toBeVisible();

    await expect(page.getByRole("link", { name: /Register Patient/i })).toHaveAttribute("href", "/register");
    await expect(page.getByRole("link", { name: /Upload ECG/i })).toHaveAttribute("href", "/ecg-upload");
    await expect(page.getByRole("link", { name: /Cardiologist Dashboard/i })).toHaveAttribute(
      "href",
      "/cardiologist"
    );
    await expect(page.getByRole("link", { name: /Admin Dashboard/i })).toHaveAttribute("href", "/admin");
  });

  test("navigates to patient registration from home", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Register Patient/i }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("heading", { name: "Patient Registration" })).toBeVisible();
  });

  test("navigates to ECG upload from home", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Upload ECG/i }).click();
    await expect(page).toHaveURL(/\/ecg-upload$/);
    await expect(page.getByRole("heading", { name: "Upload ECG" })).toBeVisible();
    await expect(page.getByText(/Step 1 — Find Patient/i)).toBeVisible();
  });
});
