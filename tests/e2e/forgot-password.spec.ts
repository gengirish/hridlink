import { test, expect } from "@playwright/test";

// Neon Auth (Better Auth) request-password-reset endpoint. Mocked so tests are
// deterministic and never depend on a live Neon Auth backend.
const RESET_REQUEST_ROUTE = /\/api\/auth\/(request-password-reset|forget-password)/;

test.describe("Forgot password", () => {
  test("renders the form and links back to sign-in", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  test("send button is disabled until an email is entered", async ({ page }) => {
    await page.goto("/forgot-password");
    const send = page.getByRole("button", { name: "Send reset link" });
    await expect(send).toBeDisabled();
    await page.getByLabel("Email").fill("hw@hridlink.com");
    await expect(send).toBeEnabled();
  });

  test("successful request shows the generic check-your-inbox confirmation", async ({ page }) => {
    await page.route(RESET_REQUEST_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: true }),
      });
    });

    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill("hw@hridlink.com");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
    await expect(page.getByText("hw@hridlink.com")).toBeVisible();
  });

  test("'try a different email' returns to the form", async ({ page }) => {
    await page.route(RESET_REQUEST_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: true }),
      });
    });

    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill("typo@hridlink.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();

    await page.getByRole("button", { name: "try a different email" }).click();
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("request failure surfaces an inline error (mocked 429)", async ({ page }) => {
    await page.route(RESET_REQUEST_ROUTE, async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ message: "Too many reset requests. Try again later." }),
      });
    });

    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill("hw@hridlink.com");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.locator("#forgot-error")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toHaveCount(0);
  });
});
