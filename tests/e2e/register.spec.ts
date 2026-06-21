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
    await page.getByRole("spinbutton", { name: "Age" }).fill("45");
    await page.getByLabel("Gender").selectOption("MALE");
    await page.getByLabel("Village").fill("Test Village");
    await page.getByLabel("District").fill("Test District");
    await page.getByLabel("Aadhaar Last 4").fill("1234");
    await page.getByLabel(/Mobile Number/i).fill("5550000");
    await page.getByRole("button", { name: "Register Patient" }).click();
    await expect(page.getByText(/Must be a valid Indian mobile number/i)).toBeVisible();
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
    await page.getByRole("spinbutton", { name: "Age" }).fill("52");
    await page.getByLabel("Gender").selectOption("FEMALE");
    await page.getByLabel("Village").fill("Kothapally");
    await page.getByLabel("District").fill("Nalgonda");
    await page.getByLabel("Aadhaar Last 4").fill("9012");
    await page.getByLabel(/Mobile Number/i).fill("+919876543299");
    await page.getByRole("button", { name: "Register Patient" }).click();

    await expect(page.getByRole("heading", { name: "Patient registered" })).toBeVisible();
    await expect(page.getByText("E2E Registered Patient")).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Upload ECG", exact: true })).toBeVisible();
  });

  test("after success, Register another returns to the form", async ({ page }) => {
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
          data: { id: "clhride2eanother01", fullName: "Another Patient" },
        }),
      });
    });

    await page.getByLabel("Full Name").fill("Another Patient");
    await page.getByRole("spinbutton", { name: "Age" }).fill("40");
    await page.getByLabel("Gender").selectOption("MALE");
    await page.getByLabel("Village").fill("V1");
    await page.getByLabel("District").fill("D1");
    await page.getByLabel("Aadhaar Last 4").fill("2222");
    await page.getByLabel(/Mobile Number/i).fill("+919876543211");
    await page.getByRole("button", { name: "Register Patient" }).click();

    await expect(page.getByRole("heading", { name: "Patient registered" })).toBeVisible();
    await page.getByRole("button", { name: "Register another" }).click();

    await expect(page.getByRole("heading", { name: "Patient registration" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Register Patient" })).toBeVisible();
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
    await page.getByRole("spinbutton", { name: "Age" }).fill("40");
    await page.getByLabel("Gender").selectOption("MALE");
    await page.getByLabel("Village").fill("V1");
    await page.getByLabel("District").fill("D1");
    await page.getByLabel("Aadhaar Last 4").fill("1111");
    await page.getByLabel(/Mobile Number/i).fill("+919876543298");
    await page.getByRole("button", { name: "Register Patient" }).click();

    await expect(page.getByText("A patient with this phone number already exists")).toBeVisible();
  });

  test("shows validation for non-numeric Aadhaar last 4", async ({ page }) => {
    await page.getByLabel("Full Name").fill("Aadhaar Test");
    await page.getByRole("spinbutton", { name: "Age" }).fill("33");
    await page.getByLabel("Gender").selectOption("MALE");
    await page.getByLabel("Village").fill("V");
    await page.getByLabel("District").fill("D");
    await page.getByLabel("Aadhaar Last 4").fill("12ab");
    await page.getByLabel(/Mobile Number/i).fill("+919876543277");
    await page.getByRole("button", { name: "Register Patient" }).click();
    await expect(page.getByText("Must be exactly 4 digits")).toBeVisible();
  });

  test("unauthenticated registration shows toast (mocked 401)", async ({ page }) => {
    await page.route("**/api/patients", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({ status: 401, body: "" });
    });

    await page.getByLabel("Full Name").fill("Auth Gate");
    await page.getByRole("spinbutton", { name: "Age" }).fill("30");
    await page.getByLabel("Gender").selectOption("FEMALE");
    await page.getByLabel("Village").fill("V");
    await page.getByLabel("District").fill("D");
    await page.getByLabel("Aadhaar Last 4").fill("3333");
    await page.getByLabel(/Mobile Number/i).fill("+919876543276");
    await page.getByRole("button", { name: "Register Patient" }).click();

    await expect(page.getByText("Please sign in as a health worker")).toBeVisible();
  });

  test("invalid JSON from API shows registration failed toast", async ({ page }) => {
    await page.route("**/api/patients", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "not json",
      });
    });

    await page.getByLabel("Full Name").fill("Bad JSON");
    await page.getByRole("spinbutton", { name: "Age" }).fill("41");
    await page.getByLabel("Gender").selectOption("MALE");
    await page.getByLabel("Village").fill("V");
    await page.getByLabel("District").fill("D");
    await page.getByLabel("Aadhaar Last 4").fill("4444");
    await page.getByLabel(/Mobile Number/i).fill("+919876543275");
    await page.getByRole("button", { name: "Register Patient" }).click();

    await expect(page.getByText("Registration failed")).toBeVisible();
  });
});
