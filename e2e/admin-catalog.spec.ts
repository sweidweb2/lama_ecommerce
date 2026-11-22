import { test, expect } from "@playwright/test";
import { e2eAdmin, e2eEnabled } from "./helpers/env";
import { adminAuthFile } from "./helpers/paths";
import { requireOrSkip } from "./helpers/skip";

/**
 * Block 14 — Admin catalog (thin smoke)
 */
test.describe("Block 14 — admin catalog smoke", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");
  test.use({ storageState: adminAuthFile });

  test("products list loads with create link", async ({ page }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    await page.goto("/admin/products");
    await expect(
      page.getByRole("heading", { name: /^products$/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("link", { name: /create product/i }),
    ).toBeVisible();
  });
});
