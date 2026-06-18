import { test, expect } from "@playwright/test";

test.describe("ECG upload", () => {
  test("patient search shows not found toast (mocked 404)", async ({ page }) => {
    await page.route("**/api/patients?phone=*", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "Patient not found" }),
      });
    });

    await page.goto("/ecg-upload");
    await page.getByLabel("Patient phone number").fill("+919000000001");
    await page.getByRole("button", { name: "Search patient by phone" }).click();

    await expect(page.getByText("Patient not found for that phone number")).toBeVisible();
  });

  test("full upload flow with mocked patient search and ECG create", async ({ page }) => {
    const patientId = "clhride2etestpatientid01";

    await page.route("**/api/patients?phone=*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: patientId,
            fullName: "Mock Patient",
            age: 55,
            village: "Test Village",
            district: "Test District",
            phone: "+919876543200",
          },
        }),
      });
    });

    await page.route("**/api/ecg", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { id: "clhride2etecgrecord01" } }),
      });
    });

    await page.goto("/ecg-upload");
    await page.getByLabel("Patient phone number").fill("+919876543200");
    await page.getByRole("button", { name: "Search patient by phone" }).click();

    await expect(page.getByText("Mock Patient")).toBeVisible();
    await expect(page.getByText(/55y/)).toBeVisible();

    await page.getByRole("button", { name: /Tap to upload ECG/i }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "ecg-test.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      ),
    });

    await expect(page.getByText("ecg-test.png")).toBeVisible();
    await page.getByRole("button", { name: "Submit ECG" }).click();

    await expect(page.getByRole("heading", { name: "ECG Uploaded" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
  });
});
