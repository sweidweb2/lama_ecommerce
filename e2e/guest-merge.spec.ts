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
import {
  deleteOrderById,
  e2eDbReady,
  ensureE2eCustomer,
  seedPendingOrder,
} from "./helpers/db";
import { orderShortCode } from "./helpers/orders";
import { requireOrSkip } from "./helpers/skip";

/**
 * Block 2 — Guest session & merge-on-login
 *
 * Needs catalog products with in-stock variants + customer (and admin) creds.
 */
test.describe("Block 2 — guest merge-on-login", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");
  test.use({ storageState: { cookies: [], origins: [] } });

  test("guest ATC then customer login merges cart", async ({ page }) => {
    requireOrSkip(e2eUser.ready(), "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");
    await logoutIfPossible(page);

    const opened = await openFirstProduct(page);
    requireOrSkip(opened, "No products in catalog — seed products first");

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
    requireOrSkip(e2eUser.ready(), "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");
    await logoutIfPossible(page);

    const opened = await openFirstProduct(page);
    requireOrSkip(opened, "No products in catalog — seed products first");

    await selectFirstAvailableVariant(page);
    await addSelectedVariantToWishlist(page);

    await page.goto("/wishlist");
    await expect(
      page.getByRole("heading", { name: /wishlist/i }).first(),
    ).toBeVisible();
    await expect(page.locator('a[href^="/products/"]').first()).toBeVisible({
      timeout: 15_000,
    });

    await loginViaUi(page, e2eUser.email()!, e2eUser.password()!);
    await expectLoggedInAsCustomer(page);

    await page.goto("/wishlist");
    await expect(page.locator('a[href^="/products/"]').first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("admin login clears guest cookie without claiming cart", async ({
    page,
  }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    await logoutIfPossible(page);

    await page.goto("/products");
    const cookiesBefore = await page.context().cookies();
    const guestBefore = cookiesBefore.find(
      (c) => c.name === GUEST_SESSION_COOKIE,
    );
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

    // AuthProvider handoff clears the cookie asynchronously after login.
    await expect
      .poll(
        async () => {
          const cookies = await page.context().cookies();
          return cookies.find((c) => c.name === GUEST_SESSION_COOKIE);
        },
        { timeout: 25_000 },
      )
      .toBeUndefined();
  });

  test("guest order then login claims when email matches", async ({
    page,
    context,
  }) => {
    requireOrSkip(e2eDbReady(), "Needs Supabase service role");
    requireOrSkip(e2eUser.ready() || e2eDbReady(), "Needs customer credentials");

    const customer = e2eUser.ready()
      ? await ensureE2eCustomer({
          email: e2eUser.email()!,
          password: e2eUser.password()!,
        })
      : await ensureE2eCustomer();

    await logoutIfPossible(page);
    // Mint a guest cookie, then seed an order for that session + customer email.
    await page.goto("/products");
    const cookies = await context.cookies();
    const guest = cookies.find((c) => c.name === GUEST_SESSION_COOKIE);
    requireOrSkip(Boolean(guest?.value), "Guest session cookie missing");

    const order = await seedPendingOrder({
      email: customer.email,
      sessionId: guest!.value,
    });

    try {
      await loginViaUi(page, customer.email, customer.password);
      await expectLoggedInAsCustomer(page);

      await page.goto("/orders");
      await expect(
        page.getByRole("heading", { name: /my orders/i }),
      ).toBeVisible({ timeout: 15_000 });
      const short = orderShortCode(order.id);
      await expect(page.getByText(new RegExp(short, "i")).first()).toBeVisible({
        timeout: 20_000,
      });
    } finally {
      await deleteOrderById(order.id);
    }
  });
});
