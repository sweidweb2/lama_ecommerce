import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { e2eAdmin, e2eEnabled } from "./helpers/env";
import {
  adminCartPath,
  expectToast,
  loginAsAdmin,
  selectOption,
} from "./helpers/admin";
import {
  deleteCartById,
  deleteCartBySessionId,
  deleteOrdersByEmailFragment,
  e2eDbReady,
  ensureShippingZone,
  findCartBySessionId,
  getInStockProductName,
} from "./helpers/db";
import type { Page } from "@playwright/test";

async function pickFirstAvailableVariant(page: Page): Promise<void> {
  const colorButtons = page.getByRole("button", { name: /select color/i });
  for (let i = 0; i < (await colorButtons.count()); i += 1) {
    const btn = colorButtons.nth(i);
    if (await btn.isEnabled()) {
      await btn.click();
      break;
    }
  }

  const sizeButtons = page.getByRole("button", { name: /select size/i });
  for (let i = 0; i < (await sizeButtons.count()); i += 1) {
    const btn = sizeButtons.nth(i);
    if (await btn.isEnabled()) {
      await btn.click();
      break;
    }
  }

  const materialTrigger = page
    .locator("div.space-y-2")
    .filter({ has: page.getByText(/^material/i) })
    .getByRole("combobox");
  if (await materialTrigger.count()) {
    await materialTrigger.click();
    const options = page.locator('[role="option"]:not([data-disabled])');
    if (await options.count()) await options.first().click();
    else await page.getByRole("option").first().click();
  }
}

/**
 * Block 17 — Admin carts & admin checkout
 */
test.describe("Block 17 — admin carts & checkout", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");

  test("create cart with session id", async ({ page }) => {
    test.skip(!e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    test.skip(!e2eDbReady(), "Needs Supabase service role for cart cleanup");

    const sessionId = `e2e-cart-${randomUUID()}`;
    try {
      await loginAsAdmin(page);
      await page.goto("/admin/carts");
      await expect(page.getByRole("heading", { name: /^carts$/i })).toBeVisible();

      await page.getByRole("button", { name: /create cart/i }).click();
      await expect(
        page.getByRole("heading", { name: /^create cart$/i }),
      ).toBeVisible();
      await page.locator("#session-id").fill(sessionId);
      await page.getByRole("button", { name: /^create cart$/i }).click();
      await expectToast(page, /cart created successfully/i);

      const cart = await findCartBySessionId(sessionId);
      expect(cart?.id).toBeTruthy();
    } finally {
      await deleteCartBySessionId(sessionId);
    }
  });

  test("add / edit / delete cart lines", async ({ page }) => {
    test.skip(!e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    test.skip(!e2eDbReady(), "Needs Supabase service role for cart cleanup");

    const productName = await getInStockProductName();
    test.skip(!productName, "No in-stock product — seed products first");

    const sessionId = `e2e-lines-${randomUUID()}`;
    let cartId: string | undefined;
    try {
      await loginAsAdmin(page);
      await page.goto("/admin/carts");
      await page.getByRole("button", { name: /create cart/i }).click();
      await page.locator("#session-id").fill(sessionId);
      await page.getByRole("button", { name: /^create cart$/i }).click();
      await expectToast(page, /cart created successfully/i);

      const cart = await findCartBySessionId(sessionId);
      expect(cart?.id).toBeTruthy();
      cartId = cart!.id;

      await page.goto(adminCartPath(cartId));
      await expect(page.getByText(/no items in this cart/i)).toBeVisible();

      await page.getByRole("button", { name: /add items to cart/i }).click();
      await expect(
        page.getByRole("heading", { name: /add items to cart/i }),
      ).toBeVisible();

      await selectOption(
        page,
        page.locator("#product"),
        new RegExp(productName!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      );

      await pickFirstAvailableVariant(page);

      await expect(page.getByText(/selected variant/i)).toBeVisible({
        timeout: 10_000,
      });
      await page.getByRole("button", { name: /^add to cart$/i }).click();
      await expectToast(page, /item added/i);

      await expect(page.getByText(/no items in this cart/i)).toHaveCount(0, {
        timeout: 15_000,
      });

      const editBtn = page.getByRole("button", { name: /edit cart item/i }).first();
      await editBtn.click();
      await expect(
        page.getByRole("heading", { name: /edit cart item quantity/i }),
      ).toBeVisible();
      const qtyInput = page.locator('input[id^="quantity-"]');
      await qtyInput.fill("2");
      await page.getByRole("button", { name: /update quantity/i }).click();
      await expectToast(page, /quantity updated/i);
      await expect(page.getByRole("cell", { name: /^2$/ }).first()).toBeVisible({
        timeout: 15_000,
      });

      await page
        .getByRole("button", { name: /delete cart item/i })
        .first()
        .click();
      await expect(
        page.getByRole("heading", { name: /delete cart item/i }),
      ).toBeVisible();
      await page.getByRole("button", { name: /^delete item$/i }).click();
      await expect(page.getByText(/no items in this cart/i)).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      if (cartId) await deleteCartById(cartId);
      else await deleteCartBySessionId(sessionId);
    }
  });

  test("empty cart checkout fails", async ({ page }) => {
    test.skip(!e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    test.skip(!e2eDbReady(), "Needs Supabase service role");

    const zone = await ensureShippingZone();
    const sessionId = `e2e-empty-${randomUUID()}`;
    let cartId: string | undefined;
    try {
      await loginAsAdmin(page);
      await page.goto("/admin/carts");
      await page.getByRole("button", { name: /create cart/i }).click();
      await page.locator("#session-id").fill(sessionId);
      await page.getByRole("button", { name: /^create cart$/i }).click();
      await expectToast(page, /cart created successfully/i);

      const cart = await findCartBySessionId(sessionId);
      expect(cart?.id).toBeTruthy();
      cartId = cart!.id;

      await page.goto(adminCartPath(cartId));
      await page.getByRole("button", { name: /submit cart/i }).click();
      await expect(page.getByRole("heading", { name: /^checkout$/i })).toBeVisible();

      await selectOption(
        page,
        page.getByRole("combobox").filter({ hasText: /select shipping zone/i }),
        new RegExp(zone.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      );
      await page.getByPlaceholder(/^country$/i).fill("Israel");
      await page.getByPlaceholder(/^city$/i).fill("Tel Aviv");
      await page.getByPlaceholder(/street address/i).fill("1 Empty Cart St");
      await page.getByPlaceholder(/phone number/i).fill("0501234567");
      await page.getByPlaceholder(/email address/i).fill(`empty-${Date.now()}@example.com`);

      await page.getByRole("button", { name: /^place order$/i }).click();
      await expectToast(page, /checkout failed/i);
      await expectToast(page, /cart is empty/i);
    } finally {
      if (cartId) await deleteCartById(cartId);
      else await deleteCartBySessionId(sessionId);
    }
  });

  test("checkout as cart owner creates order", async ({ page }) => {
    test.skip(!e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    test.skip(!e2eDbReady(), "Needs Supabase service role");

    const productName = await getInStockProductName();
    test.skip(!productName, "No in-stock product — seed products first");
    const zone = await ensureShippingZone();

    const sessionId = `e2e-checkout-${randomUUID()}`;
    const orderEmail = `e2e-admin-checkout-${Date.now()}@example.com`;
    let cartId: string | undefined;
    try {
      await loginAsAdmin(page);
      await page.goto("/admin/carts");
      await page.getByRole("button", { name: /create cart/i }).click();
      await page.locator("#session-id").fill(sessionId);
      await page.getByRole("button", { name: /^create cart$/i }).click();
      await expectToast(page, /cart created successfully/i);

      const cart = await findCartBySessionId(sessionId);
      expect(cart?.id).toBeTruthy();
      cartId = cart!.id;

      await page.goto(adminCartPath(cartId));
      await page.getByRole("button", { name: /add items to cart/i }).click();
      await selectOption(
        page,
        page.locator("#product"),
        new RegExp(productName!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      );

      await pickFirstAvailableVariant(page);

      await expect(page.getByText(/selected variant/i)).toBeVisible({
        timeout: 10_000,
      });
      await page.getByRole("button", { name: /^add to cart$/i }).click();
      await expectToast(page, /item added/i);

      await page.getByRole("button", { name: /submit cart/i }).click();
      await expect(page.getByRole("heading", { name: /^checkout$/i })).toBeVisible();

      // Shipping zone select — first combobox in checkout dialog after load
      await page.getByText(/select shipping zone/i).click();
      await page
        .getByRole("option", {
          name: new RegExp(zone.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
        })
        .click();

      await page.getByPlaceholder(/^country$/i).fill("Israel");
      await page.getByPlaceholder(/^city$/i).fill("Haifa");
      await page.getByPlaceholder(/street address/i).fill("9 Checkout Ave");
      await page.getByPlaceholder(/phone number/i).fill("0509876543");
      await page.getByPlaceholder(/email address/i).fill(orderEmail);

      await page.getByRole("button", { name: /^place order$/i }).click();
      await expectToast(page, /order placed/i);
      await expectToast(page, /order has been created successfully/i);
    } finally {
      await deleteOrdersByEmailFragment("e2e-admin-checkout-");
      if (cartId) await deleteCartById(cartId).catch(() => undefined);
      await deleteCartBySessionId(sessionId).catch(() => undefined);
    }
  });
});
