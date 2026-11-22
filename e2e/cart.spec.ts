import { test, expect } from "@playwright/test";
import { e2eEnabled } from "./helpers/env";
import { logoutIfPossible } from "./helpers/auth";
import {
  addSelectedVariantToCart,
  openFirstProduct,
  selectFirstAvailableVariant,
} from "./helpers/catalog";
import { requireOrSkip } from "./helpers/skip";

/**
 * Block 6 — Cart
 */
test.describe("Block 6 — cart", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await logoutIfPossible(page);
  });

  test("empty cart shows empty state", async ({ page }) => {
    await page.goto("/cart");
    const emptyHeading = page.getByRole("heading", {
      name: /your cart is empty/i,
    });
    const emptyCopy = page.getByText(/your cart is empty\. start adding/i);
    await expect(emptyHeading.or(emptyCopy).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("floating cart button appears after ATC", async ({ page }) => {
    const opened = await openFirstProduct(page);
    requireOrSkip(opened, "No products in catalog — seed products first");
    await selectFirstAvailableVariant(page);
    await addSelectedVariantToCart(page);

    await page.goto("/products");
    await expect(
      page.getByRole("button", { name: /view cart/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("guest can remove cart line", async ({ page }) => {
    const opened = await openFirstProduct(page);
    requireOrSkip(opened, "No products in catalog — seed products first");

    await selectFirstAvailableVariant(page);
    await addSelectedVariantToCart(page);

    await page.goto("/cart");
    await expect(page.getByTestId("cart-item").first()).toBeVisible({
      timeout: 15_000,
    });

    const increase = page.getByTestId("increase-quantity-button").first();
    if (await increase.isEnabled()) {
      const qty = page.getByTestId("cart-item-quantity").first();
      const before = Number((await qty.innerText()).trim());
      await increase.click();
      await expect(qty).toHaveText(String(before + 1), { timeout: 15_000 });
    }

    await page.getByTestId("remove-cart-item-button").first().click();
    await expect(
      page.getByRole("heading", { name: /remove item from cart/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^remove item$/i }).click();
    await expect(
      page.getByText(/your cart is empty\. start adding/i),
    ).toBeVisible({ timeout: 15_000 });
  });
});
