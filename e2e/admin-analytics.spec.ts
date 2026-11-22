import { test, expect } from "@playwright/test";
import { e2eAdmin, e2eEnabled } from "./helpers/env";
import { logoutIfPossible } from "./helpers/auth";
import { adminAuthFile, customerAuthFile } from "./helpers/paths";
import { requireOrSkip } from "./helpers/skip";

/**
 * Block 13 — Admin shell & analytics
 */
test.describe("Block 13 — admin shell & analytics", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");

  test.describe("guest", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("guest visiting /admin is sent to login", async ({ page }) => {
      await logoutIfPossible(page);
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page).toHaveURL(/redirect=/);
    });
  });

  test.describe("customer", () => {
    test.use({ storageState: customerAuthFile });

    test("customer visiting /admin is sent home", async ({ page }) => {
      await page.goto("/admin");
      await expect(page).toHaveURL((url) => url.pathname === "/");
      await expect(page).not.toHaveURL(/\/admin/);
    });
  });

  test.describe("admin", () => {
    test.use({ storageState: adminAuthFile });

    test("admin sees analytics KPIs and date presets update URL", async ({
      page,
    }) => {
      requireOrSkip(
        e2eAdmin.ready(),
        "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD",
      );
      await page.goto("/admin/analytics");

      await expect(
        page.getByRole("heading", { name: /^analytics$/i }),
      ).toBeVisible();
      await expect(page.getByText(/^active users$/i).first()).toBeVisible();
      await expect(page.getByText(/^active products$/i).first()).toBeVisible();
      await expect(
        page.getByRole("alert").filter({
          hasText: /some analytics data could not be loaded/i,
        }),
      ).toHaveCount(0);

      await page.getByRole("button", { name: /last 30 days/i }).click();
      await expect(page).toHaveURL(/preset=last_30d/);
      await expect(
        page.getByRole("heading", { name: /^analytics$/i }),
      ).toBeVisible();

      await page.getByRole("button", { name: /this month/i }).click();
      await expect(page).toHaveURL(/preset=this_month/);
    });
  });
});
