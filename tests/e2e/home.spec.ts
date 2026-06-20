import { test, expect } from "@playwright/test";

test.describe("Home", () => {
  test("shows hero, workspace, and primary CTAs", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /ECGs from the village/i, level: 1 })).toBeVisible();
    await expect(page.getByText("Workspace")).toBeVisible();
    await expect(page.getByText("Where do you want to go?", { exact: true })).toBeVisible();

    await expect(page.getByRole("link", { name: /Register a patient/i })).toHaveAttribute("href", "/register");
    await expect(page.getByRole("link", { name: /Upload an ECG/i })).toHaveAttribute("href", "/ecg-upload");
    await expect(page.getByRole("link", { name: /Register patient/i }).first()).toHaveAttribute("href", "/register");
    await expect(page.getByRole("link", { name: "Cardiologist", exact: true })).toHaveAttribute("href", "/cardiologist");
    await expect(page.getByRole("link", { name: "Admin", exact: true })).toHaveAttribute("href", "/admin");
  });

  test("navigates to patient registration from hero CTA", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Register a patient/i }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("heading", { name: "Patient registration" })).toBeVisible();
  });

  test("navigates to ECG upload from hero secondary CTA", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Upload an ECG/i }).click();
    await expect(page).toHaveURL(/\/ecg-upload$/);
    await expect(page.getByRole("heading", { name: "Upload ECG" })).toBeVisible();
    await expect(page.getByText(/Find patient/i)).toBeVisible();
  });

  test("demo guide link is available from home footer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Open the demo guide/i }).click();
    await expect(page).toHaveURL(/\/demo$/);
    await expect(page.getByRole("heading", { name: "Demo guide" })).toBeVisible();
  });
});
