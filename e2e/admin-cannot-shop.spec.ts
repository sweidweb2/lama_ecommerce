import { test, expect } from "@playwright/test";
import { e2eAdmin, e2eEnabled } from "./helpers/env";
import { loginAsAdmin } from "./helpers/admin";
import { expectLoggedInAsAdmin } from "./helpers/auth";
import { openFirstProduct } from "./helpers/catalog";
import { adminAuthFile } from "./helpers/paths";
import { requireOrSkip } from "./helpers/skip";

/**
 * Block 3 — Admin cannot shop
 *
 * Needs: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (+ catalog for PDP case)
 * Seed admin first: npm run seed:admin
 */
test.describe("Block 3 — admin cannot shop", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");
  test.skip(!e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
  test.use({ storageState: adminAuthFile });

  test.beforeEach(async ({ page }) => {
    // next dev ECONNRESET can drop the refresh token mid-suite; recover once.
    try {
      await expectLoggedInAsAdmin(page);
    } catch {
      await loginAsAdmin(page);
    }
  });

  test("middleware redirects admin /cart to analytics", async ({ page }) => {
    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/analytics/, { timeout: 30_000 });
  });

  test("middleware redirects admin /wishlist to analytics", async ({ page }) => {
    await page.goto("/wishlist", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/analytics/, { timeout: 30_000 });
  });

  test("admin PDP shows cannot-shop UI (no ATC)", async ({ page }) => {
    const opened = await openFirstProduct(page);
    requireOrSkip(opened, "No products in catalog — seed products first");

    await expect(
      page.getByText(/admins cannot shop on the user pages/i),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("button", { name: /^add to cart$/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /go to admin panel/i }),
    ).toBeVisible();
  });
});
