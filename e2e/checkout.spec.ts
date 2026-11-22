import { test, expect } from "@playwright/test";
import { e2eEnabled } from "./helpers/env";
import { logoutIfPossible } from "./helpers/auth";
import {
  addSelectedVariantToCart,
  openFirstProduct,
  selectFirstAvailableVariant,
} from "./helpers/catalog";
import {
  deleteOrdersByEmailFragment,
  deletePromoById,
  e2eDbReady,
  ensureShippingZone,
  seedInactivePromo,
} from "./helpers/db";
import { selectOption } from "./helpers/admin";
import { requireOrSkip } from "./helpers/skip";

/**
 * Block 8 — Checkout (storefront /cart)
 */
test.describe("Block 8 — checkout", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");
  test.use({ storageState: { cookies: [], origins: [] } });
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await logoutIfPossible(page);
  });

  test("guest checkout places order and redirects to details", async ({
    page,
  }) => {
    requireOrSkip(e2eDbReady(), "Needs Supabase service role for shipping zone");
    const zone = await ensureShippingZone();
    const orderEmail = `e2e-checkout-${Date.now()}@example.com`;

    try {
      const opened = await openFirstProduct(page);
      requireOrSkip(opened, "No products in catalog — seed products first");
      await selectFirstAvailableVariant(page);
      await addSelectedVariantToCart(page);

      await page.goto("/cart");
      await expect(page.getByTestId("cart-item").first()).toBeVisible({
        timeout: 15_000,
      });

      await selectOption(
        page,
        page.getByTestId("shipping-zone-select"),
        new RegExp(zone.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      );
      await page.getByPlaceholder(/^country$/i).fill("Israel");
      await page.getByPlaceholder(/^city$/i).fill("Tel Aviv");
      await page.getByPlaceholder(/street address/i).fill("1 Checkout St");
      await page.getByPlaceholder(/phone number/i).fill("0501234567");
      await page.getByPlaceholder(/email address/i).fill(orderEmail);

      await page.getByTestId("proceed-to-checkout-button").click();
      await expect(
        page.getByRole("heading", { name: /order placed successfully/i }),
      ).toBeVisible({ timeout: 30_000 });
      await expect(page).toHaveURL(/\/order_details\//, { timeout: 20_000 });
      await expect(
        page.getByRole("heading", { name: /order details/i }),
      ).toBeVisible({ timeout: 15_000 });
    } finally {
      await deleteOrdersByEmailFragment("e2e-checkout-");
    }
  });

  test("invalid promo fails checkout and keeps cart", async ({ page }) => {
    requireOrSkip(e2eDbReady(), "Needs Supabase service role");
    const zone = await ensureShippingZone();
    const promo = await seedInactivePromo();
    const orderEmail = `e2e-promo-fail-${Date.now()}@example.com`;

    try {
      const opened = await openFirstProduct(page);
      requireOrSkip(opened, "No products in catalog — seed products first");
      await selectFirstAvailableVariant(page);
      await addSelectedVariantToCart(page);

      await page.goto("/cart");
      await expect(page.getByTestId("cart-item").first()).toBeVisible({
        timeout: 15_000,
      });

      await selectOption(
        page,
        page.getByTestId("shipping-zone-select"),
        new RegExp(zone.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      );
      await page.getByTestId("promo-code-input").fill(promo.code);
      await page.getByPlaceholder(/^country$/i).fill("Israel");
      await page.getByPlaceholder(/^city$/i).fill("Tel Aviv");
      await page.getByPlaceholder(/street address/i).fill("2 Promo Fail St");
      await page.getByPlaceholder(/phone number/i).fill("0501234567");
      await page.getByPlaceholder(/email address/i).fill(orderEmail);

      await page.getByTestId("proceed-to-checkout-button").click();
      await expect(
        page.getByText(/promo code is not valid|promo code is inactive/i).first(),
      ).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId("cart-item").first()).toBeVisible();
      await expect(page).toHaveURL(/\/cart/);
    } finally {
      await deletePromoById(promo.id);
      await deleteOrdersByEmailFragment("e2e-promo-fail-");
    }
  });
});
