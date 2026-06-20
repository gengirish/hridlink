import { test, expect } from "@playwright/test";

test.describe("Not found", () => {
  test("shows 404 content and home link", async ({ page }) => {
    await page.goto("/__e2e_not_found_path__/missing");
    await expect(page.getByRole("heading", { name: /This page does not exist/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("link", { name: "Demo guide" })).toHaveAttribute("href", "/demo");
  });
});
