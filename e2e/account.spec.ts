import { test, expect } from "@playwright/test";
import { e2eEnabled } from "./helpers/env";
import {
  expectLoggedInAsCustomer,
  loginViaUi,
  logoutIfPossible,
} from "./helpers/auth";
import {
  createUniqueE2eCustomer,
  deleteAuthUserByEmail,
  e2eDbReady,
} from "./helpers/db";
import { customerAuthFile } from "./helpers/paths";
import { requireOrSkip } from "./helpers/skip";

/**
 * Block 10 — Profile & addresses
 */
test.describe("Block 10 — account", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");

  test.describe("unauth", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("unauth /account redirects to login with redirect param", async ({
      page,
    }) => {
      await logoutIfPossible(page);
      await page.goto("/account");
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page).toHaveURL(/redirect=/);
    });
  });

  test.describe("customer session", () => {
    test.use({ storageState: customerAuthFile });

    test("edit full name persists", async ({ page }) => {
      await page.goto("/account");
      await expect(
        page.getByRole("heading", { name: /my account/i }),
      ).toBeVisible({ timeout: 15_000 });

      const stamp = Date.now();
      const newName = `E2E Name ${stamp}`;
      await page.getByRole("button", { name: /edit profile/i }).click();
      await expect(
        page.getByRole("heading", { name: /edit profile/i }),
      ).toBeVisible();
      await page.getByLabel(/full name/i).fill(newName);
      await page.getByRole("button", { name: /^save$/i }).click();
      await expect(page.getByText(/profile updated/i).first()).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText(newName).first()).toBeVisible({
        timeout: 15_000,
      });
    });

    test("add address works", async ({ page }) => {
      await page.goto("/account");
      await expect(
        page.getByRole("heading", { name: /my account/i }),
      ).toBeVisible({ timeout: 15_000 });

      await page.getByRole("button", { name: /^add address$/i }).first().click();
      await expect(
        page.getByRole("heading", { name: /add address/i }),
      ).toBeVisible();
      await page.getByLabel(/^country$/i).fill("Israel");
      await page.getByLabel(/^city$/i).fill("Tel Aviv");
      await page.getByLabel(/street address/i).fill(`E2E Addr ${Date.now()}`);
      await page.getByLabel(/^phone$/i).fill("0501112233");
      await page.getByRole("checkbox", { name: /default address/i }).check();
      await page.getByRole("button", { name: /^add address$/i }).click();
      await expect(page.getByText(/address added/i).first()).toBeVisible({
        timeout: 15_000,
      });
    });
  });

  test.describe("password", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("wrong current password fails", async ({ page }) => {
      requireOrSkip(e2eDbReady(), "Needs Supabase service role");
      const customer = await createUniqueE2eCustomer("e2e-pwd");
      try {
        await logoutIfPossible(page);
        await loginViaUi(page, customer.email, customer.password);
        await expectLoggedInAsCustomer(page);
        await page.goto("/account");
        await expect(
          page.getByRole("heading", { name: /my account/i }),
        ).toBeVisible({ timeout: 15_000 });
        // Wait until profile chrome is hydrated (email comes from the auth user).
        await expect(page.getByText(customer.email, { exact: false }).first()).toBeVisible({
          timeout: 15_000,
        });

        await page.getByRole("button", { name: /change password/i }).click();
        await expect(
          page.getByRole("heading", { name: /change password/i }),
        ).toBeVisible();
        // Prefer placeholders — FormLabel + eye-toggle buttons confuse getByLabel.
        await page.getByPlaceholder(/^current password$/i).fill("WrongPass1!");
        await page.getByPlaceholder(/at least 8 characters/i).fill("Password2!");
        await page.getByPlaceholder(/^confirm password$/i).fill("Password2!");
        await page.getByRole("button", { name: /update password/i }).click();
        await expect(
          page
            .locator("[data-sonner-toast]")
            .filter({ hasText: /password update failed|incorrect|invalid/i })
            .first(),
        ).toBeVisible({ timeout: 25_000 });
      } finally {
        await deleteAuthUserByEmail(customer.email).catch(() => undefined);
      }
    });
  });
});
