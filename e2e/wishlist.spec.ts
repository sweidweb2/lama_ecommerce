import { test, expect } from "@playwright/test";
import { e2eEnabled } from "./helpers/env";
import { logoutIfPossible } from "./helpers/auth";
import {
  addSelectedVariantToWishlist,
  openFirstProduct,
  selectFirstAvailableVariant,
} from "./helpers/catalog";
import { requireOrSkip } from "./helpers/skip";

/**
 * Block 7 — Wishlist page
 */
test.describe("Block 7 — wishlist", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await logoutIfPossible(page);
  });

  test("guest can list and remove wishlist items", async ({ page }) => {
    const opened = await openFirstProduct(page);
    requireOrSkip(opened, "No products in catalog — seed products first");

    await selectFirstAvailableVariant(page);
    await addSelectedVariantToWishlist(page);

    await page.goto("/wishlist");
    await expect(
      page.getByRole("heading", { name: /my wishlist/i }),
    ).toBeVisible();
    const productLink = page.locator('a[href^="/products/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15_000 });

    const removeBtn = page.getByRole("button", {
      name: /remove .+ from wishlist/i,
    }).first();
    await removeBtn.click();
    await expect(page.getByText(/removed from wishlist/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(/your wishlist is empty/i),
    ).toBeVisible({ timeout: 15_000 });
  });
});
