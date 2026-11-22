import { test, expect } from "@playwright/test";
import { e2eAdmin, e2eEnabled } from "./helpers/env";
import { logoutIfPossible, tryLoginAsAdmin } from "./helpers/auth";
import { openFirstProduct } from "./helpers/catalog";

/**
 * Block 3 — Admin cannot shop
 *
 * Needs: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (+ catalog for PDP case)
 * Seed admin first: npm run seed:admin
 */
test.describe("Block 3 — admin cannot shop", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");
  test.skip(!e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await logoutIfPossible(page);
    const ok = await tryLoginAsAdmin(
      page,
      e2eAdmin.email()!,
      e2eAdmin.password()!,
    );
    test.skip(
      !ok,
      "Admin login failed — run npm run seed:admin or fix E2E_ADMIN_*",
    );
  });

  test("middleware redirects admin /cart to analytics", async ({ page }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/admin\/analytics/);
  });

  test("middleware redirects admin /wishlist to analytics", async ({ page }) => {
    await page.goto("/wishlist");
    await expect(page).toHaveURL(/\/admin\/analytics/);
  });

  test("admin PDP shows cannot-shop UI (no ATC)", async ({ page }) => {
    const opened = await openFirstProduct(page);
    test.skip(!opened, "No products in catalog — seed products first");

    await expect(
      page.getByText(/admins cannot shop on the user pages/i),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^add to cart$/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /go to admin panel/i }),
    ).toBeVisible();
  });
});
