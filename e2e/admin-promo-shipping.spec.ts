import { test, expect } from "@playwright/test";
import { e2eAdmin, e2eEnabled } from "./helpers/env";
import { expectToast } from "./helpers/admin";
import {
  deletePromoById,
  deleteShippingZoneById,
  e2eDbReady,
  findPromoIdByCode,
  findShippingZoneIdByName,
} from "./helpers/db";
import { adminAuthFile } from "./helpers/paths";
import { requireOrSkip } from "./helpers/skip";

/**
 * Block 20 — Admin promo & shipping
 */
test.describe("Block 20 — admin promo & shipping", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");
  test.use({ storageState: adminAuthFile });

  test("create shipping zone", async ({ page }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    requireOrSkip(e2eDbReady(), "Needs service role for cleanup");

    const name = `E2E Ship ${Date.now()}`;
    try {
      await page.goto("/admin/shippings");
      await expect(
        page.getByRole("heading", { name: /^shippings$/i }),
      ).toBeVisible();
      await page.getByRole("button", { name: /add shipping zone/i }).click();
      await expect(
        page.getByRole("heading", { name: /create shipping zone/i }),
      ).toBeVisible();
      await page.locator("#zone-name").fill(name);
      await page.locator("#shipping-fee").fill("12");
      await page.getByRole("button", { name: /^create zone$/i }).click();
      await expectToast(page, /shipping zone created/i);
      await expect(page.getByText(name).first()).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      const id = await findShippingZoneIdByName(name);
      if (id) await deleteShippingZoneById(id);
    }
  });

  test("create promo code", async ({ page }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    requireOrSkip(e2eDbReady(), "Needs service role for cleanup");

    const code = `E2E${Date.now().toString().slice(-8)}`;
    try {
      await page.goto("/admin/promocodes");
      await expect(
        page.getByRole("heading", { name: /promo codes/i }),
      ).toBeVisible();
      await page.getByRole("button", { name: /create promo code/i }).click();
      await expect(
        page.getByRole("heading", { name: /create promo code/i }),
      ).toBeVisible();
      await page.locator("#promo-code").fill(code);
      await page.locator("#discount-value").fill("15");
      await page.getByRole("button", { name: /^create promo code$/i }).click();
      await expectToast(page, /promo code created/i);
      await expect(page.getByText(code).first()).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      const id = await findPromoIdByCode(code);
      if (id) await deletePromoById(id);
    }
  });
});
