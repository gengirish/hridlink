import { test, expect } from "@playwright/test";

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

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

    await expect(
      page.locator("p.truncate.font-semibold", { hasText: /^Mock Patient$/ })
    ).toBeVisible();
    await expect(page.getByText(/55y/)).toBeVisible();

    await page.getByRole("button", { name: /Tap to choose image or PDF/i }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "ecg-test.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });

    await expect(page.getByText("ecg-test.png")).toBeVisible();
    await page.getByRole("button", { name: "Submit ECG" }).click();

    await expect(page.getByRole("heading", { name: "ECG submitted" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
  });

  test("submit ECG control stays disabled until patient and file are ready", async ({ page }) => {
    await page.goto("/ecg-upload");
    const submit = page.getByRole("button", { name: "Submit ECG" });
    await expect(submit).toBeDisabled();
  });

  test("after success, Upload another resets the wizard", async ({ page }) => {
    const patientId = "clhride2etestpatientid02";

    await page.route("**/api/patients?phone=*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: patientId,
            fullName: "Reset Flow Patient",
            age: 60,
            village: "A",
            district: "B",
            phone: "+919876543201",
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
        body: JSON.stringify({ success: true, data: { id: "clhride2etecgrecord02" } }),
      });
    });

    await page.goto("/ecg-upload");
    await page.getByLabel("Patient phone number").fill("+919876543201");
    await page.getByRole("button", { name: "Search patient by phone" }).click();
    await page.getByRole("button", { name: /Tap to choose image or PDF/i }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "strip.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });
    await page.getByRole("button", { name: "Submit ECG" }).click();
    await expect(page.getByRole("heading", { name: "ECG submitted" })).toBeVisible();

    await page.getByRole("button", { name: "Upload another" }).click();

    await expect(page.getByRole("heading", { name: "Upload ECG" })).toBeVisible();
    await expect(page.getByLabel("Patient phone number")).toHaveValue("");
    await expect(page.getByRole("button", { name: "Submit ECG" })).toBeDisabled();
  });

  test("patient search shows sign-in toast when API returns 401 (mocked)", async ({ page }) => {
    await page.route("**/api/patients?phone=*", async (route) => {
      await route.fulfill({ status: 401, body: "" });
    });

    await page.goto("/ecg-upload");
    await page.getByLabel("Patient phone number").fill("+919000000002");
    await page.getByRole("button", { name: "Search patient by phone" }).click();

    await expect(page.getByText("Please sign in as a health worker")).toBeVisible();
  });

  test("patient search shows error when response is not JSON (mocked)", async ({ page }) => {
    await page.route("**/api/patients?phone=*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "upstream error page",
      });
    });

    await page.goto("/ecg-upload");
    await page.getByLabel("Patient phone number").fill("+919000000003");
    await page.getByRole("button", { name: "Search patient by phone" }).click();

    await expect(page.getByText("Could not load patient data")).toBeVisible();
  });

  test("ECG submit shows API error message (mocked 200 with success false)", async ({ page }) => {
    const patientId = "clhride2etestpatientid03";

    await page.route("**/api/patients?phone=*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: patientId,
            fullName: "Error Flow Patient",
            age: 48,
            village: "V",
            district: "D",
            phone: "+919876543222",
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
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "File type not allowed for this pilot",
        }),
      });
    });

    await page.goto("/ecg-upload");
    await page.getByLabel("Patient phone number").fill("+919876543222");
    await page.getByRole("button", { name: "Search patient by phone" }).click();
    await page.getByRole("button", { name: /Tap to choose image or PDF/i }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "ecg-test.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });
    await page.getByRole("button", { name: "Submit ECG" }).click();

    await expect(page.getByText("File type not allowed for this pilot")).toBeVisible();
  });

  test("remove file disables submit until a new file is chosen", async ({ page }) => {
    const patientId = "clhride2etestpatientid04";

    await page.route("**/api/patients?phone=*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: patientId,
            fullName: "Remove File Patient",
            age: 50,
            village: "V",
            district: "D",
            phone: "+919876543223",
          },
        }),
      });
    });

    await page.goto("/ecg-upload");
    await page.getByLabel("Patient phone number").fill("+919876543223");
    await page.getByRole("button", { name: "Search patient by phone" }).click();
    await page.getByRole("button", { name: /Tap to choose image or PDF/i }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "to-remove.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });

    const submit = page.getByRole("button", { name: "Submit ECG" });
    await expect(submit).toBeEnabled();
    await page.getByRole("button", { name: "Remove file" }).click();
    await expect(submit).toBeDisabled();
  });

  test("optional health worker notes still allow successful upload (mocked)", async ({ page }) => {
    const patientId = "clhride2etestpatientid05";

    await page.route("**/api/patients?phone=*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: patientId,
            fullName: "Notes Patient",
            age: 44,
            village: "V",
            district: "D",
            phone: "+919876543224",
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
        body: JSON.stringify({ success: true, data: { id: "clhride2etecgrecordnotes" } }),
      });
    });

    await page.goto("/ecg-upload");
    await page.getByLabel("Patient phone number").fill("+919876543224");
    await page.getByRole("button", { name: "Search patient by phone" }).click();
    await page.getByRole("button", { name: /Tap to choose image or PDF/i }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "with-notes.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });
    await page.getByLabel(/Health Worker Notes/i).fill("Patient reports mild chest tightness since morning.");

    await page.getByRole("button", { name: "Submit ECG" }).click();
    await expect(page.getByRole("heading", { name: "ECG submitted" })).toBeVisible();
  });
});
