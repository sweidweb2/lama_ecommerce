import { test, expect } from "@playwright/test";

/**
 * Smoke E2E — requires a running app:
 *   npm run dev
 *   set E2E_BASE_URL=http://127.0.0.1:3000
 *   npm run test:e2e
 *
 * Skipped automatically when E2E_RUN is not "1" so CI unit jobs stay green
 * without a live server.
 */
const e2eEnabled = process.env.E2E_RUN === "1";

test.describe("storefront smoke", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 and start the app to run Playwright E2E");

  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/./);
  });

  test("contact page shows form", async ({ page }) => {
    await page.goto("/contact-us");
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/^email/i).first()).toBeVisible();
  });

  test("non-admin is redirected away from /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin\/?$/);
  });
});
