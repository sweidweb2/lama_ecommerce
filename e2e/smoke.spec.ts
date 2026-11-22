import { test, expect } from "@playwright/test";
import { e2eEnabled } from "./helpers/env";

/**
 * Block 0 — Smoke & shell
 *
 *   $env:E2E_RUN="1"
 *   npm run test:e2e -- e2e/smoke.spec.ts
 */
test.describe("Block 0 — smoke & shell", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");

  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/./);
  });

  test("contact page shows form", async ({ page }) => {
    await page.goto("/contact-us");
    await expect(page.getByRole("textbox", { name: /full name/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /^email \*$/i })).toBeVisible();
  });

  test("non-admin is redirected away from /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin\/?$/);
  });

  test("footer / nav static links resolve", async ({ page }) => {
    await page.goto("/");

    const paths = [
      "/about-us",
      "/shipping-terms",
      "/terms",
      "/privacy_policy",
      "/products",
    ] as const;

    for (const path of paths) {
      const res = await page.request.get(path);
      expect(res.status(), `${path} should not 404`).toBeLessThan(400);
    }

    await expect(page.getByRole("link", { name: /about us/i }).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /privacy policy/i }).first(),
    ).toHaveAttribute("href", "/privacy_policy");
  });

  test("search page empty state prompts to start a search", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { name: /^search$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /start a search/i })).toBeVisible();
    await expect(
      page.getByText(/enter a product name, description, sku, or brand/i),
    ).toBeVisible();
  });
});
