import { test, expect } from "@playwright/test";
import { e2eEnabled } from "./helpers/env";
import {
  addSelectedVariantToCart,
  addSelectedVariantToWishlist,
  openFirstProduct,
  selectFirstAvailableVariant,
} from "./helpers/catalog";
import { logoutIfPossible } from "./helpers/auth";

/**
 * Block 5 — Product detail (PDP)
 */
test.describe("Block 5 — product detail (PDP)", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");

  test.beforeEach(async ({ page }) => {
    await logoutIfPossible(page);
  });

  test("unknown slug shows 404", async ({ page }) => {
    await page.goto("/products/e2e-missing-product-slug-xyz");
    await expect(page.getByText(/error 404/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /page not found/i }),
    ).toBeVisible();
  });

  test("variant select shows in-stock state", async ({ page }) => {
    const opened = await openFirstProduct(page);
    test.skip(!opened, "No products in catalog — seed products first");

    await selectFirstAvailableVariant(page);
    await expect(page.getByText(/in stock/i).first()).toBeVisible();
  });

  test("guest ATC adds item to cart", async ({ page }) => {
    const opened = await openFirstProduct(page);
    test.skip(!opened, "No products in catalog — seed products first");

    await selectFirstAvailableVariant(page);
    await addSelectedVariantToCart(page);

    await page.goto("/cart");
    await expect(page.getByTestId("cart-item").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("guest wishlist toggle flips heart", async ({ page }) => {
    const opened = await openFirstProduct(page);
    test.skip(!opened, "No products in catalog — seed products first");

    await selectFirstAvailableVariant(page);
    await addSelectedVariantToWishlist(page);
    await expect(page.getByRole("button", { name: /in wishlist/i })).toBeVisible();
  });

  test("guest cannot submit review (login CTA)", async ({ page }) => {
    const opened = await openFirstProduct(page);
    test.skip(!opened, "No products in catalog — seed products first");

    await expect(
      page.getByRole("link", { name: /sign in to review/i }),
    ).toBeVisible();
  });

  test("guest cannot ask Q&A (login CTA)", async ({ page }) => {
    const opened = await openFirstProduct(page);
    test.skip(!opened, "No products in catalog — seed products first");

    await expect(
      page.getByRole("link", { name: /sign in to ask/i }),
    ).toBeVisible();
  });

  test("related products section renders when present", async ({ page }) => {
    const opened = await openFirstProduct(page);
    test.skip(!opened, "No products in catalog — seed products first");

    const related = page.getByRole("heading", { name: /related products/i });
    if ((await related.count()) === 0) {
      test.skip(true, "No related products for this PDP");
    }
    await expect(related).toBeVisible();
  });
});
