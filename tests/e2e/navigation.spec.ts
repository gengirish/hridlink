import { test, expect } from "@playwright/test";

test.describe("App navigation (guest)", () => {
  test("primary nav exposes core routes and sign-in", async ({ page }) => {
    await page.goto("/");

    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link", { name: /HridLink/i })).toHaveAttribute("href", "/");
    await expect(nav.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");
    await expect(nav.getByRole("link", { name: "Upload ECG" })).toHaveAttribute("href", "/ecg-upload");
    await expect(nav.getByRole("link", { name: "Cardiologist" })).toHaveAttribute("href", "/cardiologist");
    await expect(nav.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
    await expect(nav.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
  });

  test("Demo link appears in nav on wide viewports", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Demo" })).toHaveAttribute(
      "href",
      "/demo"
    );
  });
});
