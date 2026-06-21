import { test, expect } from "@playwright/test";

test.describe("Web app manifest", () => {
  test("returns JSON with HridLink identity", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok(), `manifest status ${res.status()}`).toBeTruthy();
    const json = (await res.json()) as { name?: string; short_name?: string };
    expect(json.name ?? "").toMatch(/HridLink/i);
    expect(json.short_name ?? "").toMatch(/HridLink/i);
  });
});
