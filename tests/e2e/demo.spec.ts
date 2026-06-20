import { test, expect } from "@playwright/test";

test.describe("Demo guide page", () => {
  test("shows role walkthroughs and quick links", async ({ page }) => {
    await page.goto("/demo");

    await expect(page.getByRole("heading", { name: "Demo guide" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Health worker" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cardiologist" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();

    await expect(page.getByText("Quick links", { exact: true })).toBeVisible();

    const quickLinks = page.locator(".card").filter({ hasText: "Quick links" });
    await expect(quickLinks.getByRole("link", { name: "Register patient" })).toHaveAttribute("href", "/register");
    await expect(quickLinks.getByRole("link", { name: "Upload ECG" })).toHaveAttribute("href", "/ecg-upload");
    await expect(quickLinks.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/sign-up");
  });
});
