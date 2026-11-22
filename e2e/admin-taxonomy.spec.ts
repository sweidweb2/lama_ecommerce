import { test, expect } from "@playwright/test";
import { e2eAdmin, e2eEnabled } from "./helpers/env";
import {
  deleteBrandById,
  deleteCategoryById,
  e2eDbReady,
  findBrandIdByName,
  findCategoryIdBySlug,
} from "./helpers/db";
import { adminAuthFile } from "./helpers/paths";
import { requireOrSkip } from "./helpers/skip";

/**
 * Block 15 — Admin brands & categories
 */
test.describe("Block 15 — admin taxonomy", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");
  test.use({ storageState: adminAuthFile });

  test("create brand", async ({ page }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    requireOrSkip(e2eDbReady(), "Needs service role for cleanup");

    const name = `E2E Brand ${Date.now()}`;
    try {
      await page.goto("/admin/brands");
      await expect(
        page.getByRole("heading", { name: /^brands$/i }),
      ).toBeVisible();
      await page.getByRole("button", { name: /add brand/i }).click();
      await expect(
        page.getByRole("heading", { name: /create brand/i }),
      ).toBeVisible();
      await page.locator("#brand-name").fill(name);
      await page.getByRole("button", { name: /^create brand$/i }).click();
      await expect(page.getByText(name).first()).toBeVisible({
        timeout: 20_000,
      });
    } finally {
      const id = await findBrandIdByName(name);
      if (id) await deleteBrandById(id);
    }
  });

  test("create category", async ({ page }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    requireOrSkip(e2eDbReady(), "Needs service role for cleanup");

    const stamp = Date.now();
    const name = `E2E Cat ${stamp}`;
    const slug = `e2e-cat-${stamp}`;
    try {
      await page.goto("/admin/categories");
      await expect(
        page.getByRole("heading", { name: /^categories$/i }),
      ).toBeVisible();
      await page.getByRole("button", { name: /add category/i }).click();
      await expect(
        page.getByRole("heading", { name: /create category/i }),
      ).toBeVisible();
      await page.locator("#category-name").fill(name);
      await page.locator("#category-slug").fill(slug);
      await page.getByRole("button", { name: /^create category$/i }).click();
      await expect(page.getByText(name).first()).toBeVisible({
        timeout: 20_000,
      });
    } finally {
      const id = await findCategoryIdBySlug(slug);
      if (id) await deleteCategoryById(id);
    }
  });
});
