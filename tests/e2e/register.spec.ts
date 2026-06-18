import { test, expect } from "@playwright/test";

test.describe("Patient registration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("shows validation errors for empty submit", async ({ page }) => {
    await page.getByRole("button", { name: "Register Patient" }).click();
    await expect(page.locator("form .error-msg").first()).toBeVisible({ timeout: 5000 });
  });

  test("shows validation for invalid phone", async ({ page }) => {
    await page.getByLabel("Full Name").fill("E2E Test User");
    await page.getByLabel("Age").fill("45");
    await page.getByLabel("Gender").selectOption("MALE");
    await page.getByLabel("Village").fill("Test Village");
    await page.getByLabel("District").fill("Test District");
    await page.getByLabel("Aadhaar Last 4").fill("1234");
    await page.getByLabel(/Phone/i).fill("5550000");
    await page.getByRole("button", { name: "Register Patient" }).click();
    await expect(page.getByText(/Must be E\.164 Indian mobile/i)).toBeVisible();
  });

  test("successful registration shows confirmation (mocked API)", async ({ page }) => {
    await page.route("**/api/patients", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { id: "clhride2etest0001patient", fullName: "E2E Registered Patient" },
        }),
      });
    });

    await page.getByLabel("Full Name").fill("E2E Registered Patient");
    await page.getByLabel("Age").fill("52");
    await page.getByLabel("Gender").selectOption("FEMALE");
    await page.getByLabel("Village").fill("Kothapally");
    await page.getByLabel("District").fill("Nalgonda");
    await page.getByLabel("Aadhaar Last 4").fill("9012");
    await page.getByLabel(/Phone/i).fill("+919876543299");
    await page.getByRole("button", { name: "Register Patient" }).click();

    await expect(page.getByRole("heading", { name: "Patient Registered" })).toBeVisible();
    await expect(page.getByText("E2E Registered Patient")).toBeVisible();
    await expect(page.getByText(/ID:/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Upload ECG/i })).toBeVisible();
  });

  test("duplicate phone shows error from API (mocked 409)", async ({ page }) => {
    await page.route("**/api/patients", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "A patient with this phone number already exists",
        }),
      });
    });

    await page.getByLabel("Full Name").fill("Dup User");
    await page.getByLabel("Age").fill("40");
    await page.getByLabel("Gender").selectOption("MALE");
    await page.getByLabel("Village").fill("V1");
    await page.getByLabel("District").fill("D1");
    await page.getByLabel("Aadhaar Last 4").fill("1111");
    await page.getByLabel(/Phone/i).fill("+919876543298");
    await page.getByRole("button", { name: "Register Patient" }).click();

    await expect(page.getByText("A patient with this phone number already exists")).toBeVisible();
  });
});
