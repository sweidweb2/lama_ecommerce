import { test, expect } from "@playwright/test";
import { e2eAdmin, e2eEnabled } from "./helpers/env";
import { expectToast } from "./helpers/admin";
import {
  deleteLeadById,
  e2eDbReady,
  findLeadIdByEmail,
} from "./helpers/db";
import { adminAuthFile } from "./helpers/paths";
import { requireOrSkip } from "./helpers/skip";

/**
 * Block 19/21/22 — CRM + shell smokes
 */
test.describe("Block 19/21/22 — admin CRM & shell", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");
  test.use({ storageState: adminAuthFile });

  test("add lead", async ({ page }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    requireOrSkip(e2eDbReady(), "Needs service role for cleanup");

    const email = `e2e-admin-lead-${Date.now()}@example.com`;
    try {
      await page.goto("/admin/leads");
      await expect(
        page.getByRole("heading", { name: /^leads$/i }),
      ).toBeVisible();
      await page.getByRole("button", { name: /add lead/i }).click();
      await expect(
        page.getByRole("heading", { name: /add lead/i }),
      ).toBeVisible();
      await page.locator("#lead-email").fill(email);
      await page.getByRole("button", { name: /^add lead$/i }).click();
      await expectToast(page, /lead created/i);
      await expect(page.getByText(email).first()).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      const id = await findLeadIdByEmail(email);
      if (id) await deleteLeadById(id);
    }
  });

  test("contact page loads and can mark read when rows exist", async ({
    page,
  }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    await page.goto("/admin/contact");
    await expect(
      page.getByRole("heading", { name: /contact us/i }),
    ).toBeVisible({ timeout: 15_000 });

    const markRead = page.getByRole("button", { name: /mark as read/i }).first();
    if ((await markRead.count()) > 0) {
      await markRead.click();
      await expect(
        page.getByRole("button", { name: /mark as new/i }).first(),
      ).toBeVisible({ timeout: 15_000 });
    }
  });

  test("product-views page loads", async ({ page }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    await page.goto("/admin/product-views");
    await expect(
      page.getByRole("heading", { name: /product views/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("backups page loads without extracting", async ({ page }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    await page.goto("/admin/backups");
    await expect(
      page.getByRole("heading", { name: /^backups$/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /extract database/i }),
    ).toBeVisible();
  });

  test("admin account page loads", async ({ page }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    await page.goto("/admin/account");
    await expect(
      page.getByRole("heading", { name: /^account$/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
