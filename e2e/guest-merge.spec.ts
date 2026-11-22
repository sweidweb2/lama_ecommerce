import { test, expect } from "@playwright/test";
import { GUEST_SESSION_COOKIE } from "@/lib/auth/guest-session.constants";
import { e2eAdmin, e2eEnabled, e2eUser } from "./helpers/env";
import {
  expectLoggedInAsAdmin,
  expectLoggedInAsCustomer,
  loginViaUi,
  logoutIfPossible,
} from "./helpers/auth";
import {
  addSelectedVariantToCart,
  addSelectedVariantToWishlist,
  openFirstProduct,
  selectFirstAvailableVariant,
} from "./helpers/catalog";

/**
 * Block 2 — Guest session & merge-on-login
 *
 * Needs catalog products with in-stock variants + customer (and admin) creds.
 */
test.describe("Block 2 — guest merge-on-login", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");

  test("guest ATC then customer login merges cart", async ({ page }) => {
    test.skip(!e2eUser.ready(), "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");
    await logoutIfPossible(page);

    const opened = await openFirstProduct(page);
    test.skip(!opened, "No products in catalog — seed products first");

    await selectFirstAvailableVariant(page);
    await addSelectedVariantToCart(page);

    await page.goto("/cart");
    await expect(page.getByTestId("cart-item").first()).toBeVisible({
      timeout: 15_000,
    });
    const guestItemName = (
      await page.getByTestId("cart-item-name").first().innerText()
    ).trim();

    await loginViaUi(page, e2eUser.email()!, e2eUser.password()!);
    await expectLoggedInAsCustomer(page);

    // Give AuthProvider merge a moment, then verify cart.
    await page.goto("/cart");
    await expect(page.getByTestId("cart-item").first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("cart-item-name").first()).toContainText(
      guestItemName.split(/\s+/).slice(0, 2).join(" "),
      { ignoreCase: true },
    );
  });

  test("guest wishlist then customer login claims items", async ({ page }) => {
    test.skip(!e2eUser.ready(), "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");
    await logoutIfPossible(page);

    const opened = await openFirstProduct(page);
    test.skip(!opened, "No products in catalog — seed products first");

    await selectFirstAvailableVariant(page);
    await addSelectedVariantToWishlist(page);

    await page.goto("/wishlist");
    await expect(page.getByRole("heading", { name: /wishlist/i }).first()).toBeVisible();
    // At least one card / product link should be present for a non-empty guest wishlist.
    await expect(
      page.locator('a[href^="/products/"]').first(),
    ).toBeVisible({ timeout: 15_000 });

    await loginViaUi(page, e2eUser.email()!, e2eUser.password()!);
    await expectLoggedInAsCustomer(page);

    await page.goto("/wishlist");
    await expect(
      page.locator('a[href^="/products/"]').first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("admin login clears guest cookie without claiming cart", async ({
    page,
  }) => {
    test.skip(!e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    await logoutIfPossible(page);

    // Mint guest cookie via a public commerce route.
    await page.goto("/products");
    const cookiesBefore = await page.context().cookies();
    const guestBefore = cookiesBefore.find((c) => c.name === GUEST_SESSION_COOKIE);
    expect(guestBefore?.value).toBeTruthy();

    const opened = await openFirstProduct(page);
    if (opened) {
      try {
        await selectFirstAvailableVariant(page);
        await addSelectedVariantToCart(page);
      } catch {
        // Catalog may lack stock; cookie-clear assertion still applies.
      }
    }

    await loginViaUi(page, e2eAdmin.email()!, e2eAdmin.password()!);
    await expectLoggedInAsAdmin(page);

    const cookiesAfter = await page.context().cookies();
    const guestAfter = cookiesAfter.find((c) => c.name === GUEST_SESSION_COOKIE);
    expect(guestAfter, "guest cookie should be cleared on admin login").toBeUndefined();

    // Admin cannot open storefront cart.
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/admin\/analytics/);
  });

  test.skip(
    "guest order then login claims (email match) — needs Block 8 checkout fixtures",
    async () => {
      // Placeholder: implement after checkout E2E (Block 8) can place a guest order.
    },
  );
});
