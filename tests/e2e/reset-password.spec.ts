import { test, expect } from "@playwright/test";

const RESET_ROUTE = /\/api\/auth\/reset-password/;
// A plausible-length token so the form treats the link as valid (>= 10 chars).
const VALID_TOKEN = "tok_e2e_0123456789abcdef0123456789abcdef";

test.describe("Reset password", () => {
  test("missing token shows the broken-link state", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(
      page.getByRole("heading", { name: "This reset link looks broken" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Request a new link" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });

  test("INVALID_TOKEN error param shows the broken-link state", async ({ page }) => {
    await page.goto("/reset-password?error=INVALID_TOKEN");
    await expect(
      page.getByRole("heading", { name: "This reset link looks broken" }),
    ).toBeVisible();
  });

  test("valid token renders the new-password form", async ({ page }) => {
    await page.goto(`/reset-password?token=${VALID_TOKEN}`);
    await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm new password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset password" })).toBeVisible();
  });

  test("mismatched passwords show a validation error", async ({ page }) => {
    await page.goto(`/reset-password?token=${VALID_TOKEN}`);
    await page.getByLabel("New password", { exact: true }).fill("newpassword123");
    await page.getByLabel("Confirm new password").fill("differentpass123");
    await page.getByRole("button", { name: "Reset password" }).click();
    await expect(page.getByText("Passwords don't match.")).toBeVisible();
  });

  test("successful reset redirects to sign-in (mocked)", async ({ page }) => {
    await page.route(RESET_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: true }),
      });
    });

    await page.goto(`/reset-password?token=${VALID_TOKEN}`);
    await page.getByLabel("New password", { exact: true }).fill("newpassword123");
    await page.getByLabel("Confirm new password").fill("newpassword123");
    await page.getByRole("button", { name: "Reset password" }).click();

    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("expired/invalid token from API surfaces an inline error (mocked 400)", async ({ page }) => {
    await page.route(RESET_ROUTE, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Reset link has expired. Request a new one." }),
      });
    });

    await page.goto(`/reset-password?token=${VALID_TOKEN}`);
    await page.getByLabel("New password", { exact: true }).fill("newpassword123");
    await page.getByLabel("Confirm new password").fill("newpassword123");
    await page.getByRole("button", { name: "Reset password" }).click();

    await expect(page.locator("#reset-error")).toBeVisible();
    await expect(page).toHaveURL(/\/reset-password/);
  });
});
