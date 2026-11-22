import { test, expect } from "@playwright/test";
import { e2eAdmin, e2eEnabled } from "./helpers/env";
import { loginAsAdmin, selectOption } from "./helpers/admin";
import {
  deleteAuthUserByEmail,
  e2eDbReady,
  getProfileIdByEmail,
} from "./helpers/db";
import {
  expectLoggedInAsAdmin,
  loginViaUi,
  logoutIfPossible,
} from "./helpers/auth";

/**
 * Block 18 — Admin users
 */
test.describe("Block 18 — admin users", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");

  test("list + search/filter users", async ({ page }) => {
    test.skip(!e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

    await loginAsAdmin(page);
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: /^users$/i })).toBeVisible();

    await page.getByPlaceholder(/search name or email/i).fill("admin");
    await page.getByRole("button", { name: /^search$/i }).click();
    await expect(page).toHaveURL(/q=admin/);
    await expect(page.getByText(/admin@example\.com/i).first()).toBeVisible({
      timeout: 15_000,
    });

    await selectOption(
      page,
      page.getByRole("combobox").filter({ hasText: /all roles|admin|customer/i }).first(),
      /^Admin$/i,
    );
    await expect(page).toHaveURL(/role=admin/);

    await selectOption(
      page,
      page.getByRole("combobox").filter({ hasText: /all statuses|active|inactive/i }).first(),
      /^Active$/i,
    );
    await expect(page).toHaveURL(/status=active/);

    await page.getByRole("button", { name: /^clear$/i }).click();
    await expect(page).toHaveURL(/\/admin\/users\/?$/);
  });

  test("create user", async ({ page }) => {
    test.skip(!e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    test.skip(!e2eDbReady(), "Needs Supabase service role for user cleanup");

    const stamp = Date.now();
    const email = `e2e-create-${stamp}@example.com`;
    const name = `E2E Create ${stamp}`;

    try {
      await loginAsAdmin(page);
      await page.goto("/admin/users");
      await page.getByRole("button", { name: /add user/i }).click();
      await expect(
        page.getByRole("heading", { name: /create new user/i }),
      ).toBeVisible();

      await page.locator("#create-user-name").fill(name);
      await page.locator("#create-user-email").fill(email);
      await page.locator("#create-user-password").fill("Password1!");
      await page.getByRole("button", { name: /^create user$/i }).click();

      await page.getByPlaceholder(/search name or email/i).fill(email);
      await page.getByRole("button", { name: /^search$/i }).click();
      await expect(page.getByText(email).first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(name).first()).toBeVisible();
    } finally {
      await deleteAuthUserByEmail(email);
    }
  });

  test("deactivate user blocks login", async ({ page }) => {
    test.skip(!e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    test.skip(!e2eDbReady(), "Needs Supabase service role for user cleanup");

    const stamp = Date.now();
    const email = `e2e-deact-${stamp}@example.com`;
    const name = `E2E Deact ${stamp}`;
    const password = "Password1!";

    try {
      await loginAsAdmin(page);
      await page.goto("/admin/users");
      await page.getByRole("button", { name: /add user/i }).click();
      await page.locator("#create-user-name").fill(name);
      await page.locator("#create-user-email").fill(email);
      await page.locator("#create-user-password").fill(password);
      await page.getByRole("button", { name: /^create user$/i }).click();

      await page.getByPlaceholder(/search name or email/i).fill(email);
      await page.getByRole("button", { name: /^search$/i }).click();
      await expect(page.getByText(email).first()).toBeVisible({ timeout: 20_000 });

      await page.getByRole("button", { name: new RegExp(`Edit ${name}`, "i") }).click();
      await expect(page.getByRole("heading", { name: /edit user/i })).toBeVisible();

      const profileId = await getProfileIdByEmail(email);
      expect(profileId).toBeTruthy();
      await selectOption(
        page,
        page.locator(`#user-status-${profileId}`),
        /^Inactive$/i,
      );
      await page.getByRole("button", { name: /save changes/i }).click();

      await expect(
        page.getByRole("heading", { name: /edit user/i }),
      ).toHaveCount(0, { timeout: 15_000 });

      await page.getByPlaceholder(/search name or email/i).fill(email);
      await page.getByRole("button", { name: /^search$/i }).click();
      await expect(page.getByText(/^Inactive$/).first()).toBeVisible({
        timeout: 15_000,
      });

      await logoutIfPossible(page);
      await loginViaUi(page, email, password);
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(
        page.getByText(/deactivated|inactive|contact support/i).first(),
      ).toBeVisible({ timeout: 15_000 });
    } finally {
      await deleteAuthUserByEmail(email);
    }
  });

  test("promote to admin gains /admin and loses shop", async ({ page }) => {
    test.skip(!e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    test.skip(!e2eDbReady(), "Needs Supabase service role for user cleanup");

    const stamp = Date.now();
    const email = `e2e-promo-${stamp}@example.com`;
    const name = `E2E Promo ${stamp}`;
    const password = "Password1!";

    try {
      await loginAsAdmin(page);
      await page.goto("/admin/users");
      await page.getByRole("button", { name: /add user/i }).click();
      await page.locator("#create-user-name").fill(name);
      await page.locator("#create-user-email").fill(email);
      await page.locator("#create-user-password").fill(password);
      await page.getByRole("button", { name: /^create user$/i }).click();

      await page.getByPlaceholder(/search name or email/i).fill(email);
      await page.getByRole("button", { name: /^search$/i }).click();
      await expect(page.getByText(email).first()).toBeVisible({ timeout: 20_000 });

      await page.getByRole("button", { name: new RegExp(`Edit ${name}`, "i") }).click();
      const profileId = await getProfileIdByEmail(email);
      expect(profileId).toBeTruthy();
      await selectOption(
        page,
        page.locator(`#user-role-${profileId}`),
        /^Admin$/i,
      );
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(
        page.getByRole("heading", { name: /edit user/i }),
      ).toHaveCount(0, { timeout: 15_000 });

      await logoutIfPossible(page);
      await loginViaUi(page, email, password);
      await expectLoggedInAsAdmin(page);

      await page.goto("/cart");
      await expect(page).toHaveURL(/\/admin\/analytics/);
    } finally {
      await deleteAuthUserByEmail(email);
    }
  });

  test("reset password via edit user", async ({ page }) => {
    test.skip(!e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    test.skip(!e2eDbReady(), "Needs Supabase service role for user cleanup");

    const stamp = Date.now();
    const email = `e2e-reset-${stamp}@example.com`;
    const name = `E2E Reset ${stamp}`;
    const oldPassword = "Password1!";
    const newPassword = "Password2!";

    try {
      await loginAsAdmin(page);
      await page.goto("/admin/users");
      await page.getByRole("button", { name: /add user/i }).click();
      await page.locator("#create-user-name").fill(name);
      await page.locator("#create-user-email").fill(email);
      await page.locator("#create-user-password").fill(oldPassword);
      await page.getByRole("button", { name: /^create user$/i }).click();

      await page.getByPlaceholder(/search name or email/i).fill(email);
      await page.getByRole("button", { name: /^search$/i }).click();
      await expect(page.getByText(email).first()).toBeVisible({ timeout: 20_000 });

      const profileId = await getProfileIdByEmail(email);
      expect(profileId).toBeTruthy();
      await page.getByRole("button", { name: new RegExp(`Edit ${name}`, "i") }).click();
      await page.locator(`#user-password-${profileId}`).fill(newPassword);
      await page
        .locator(`#user-confirm-password-${profileId}`)
        .fill(newPassword);
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(
        page.getByRole("heading", { name: /edit user/i }),
      ).toHaveCount(0, { timeout: 15_000 });

      await logoutIfPossible(page);
      await loginViaUi(page, email, newPassword);
      await expect(page).not.toHaveURL(/\/auth\/login/);
      await expect(page).toHaveURL((url) => url.pathname === "/");
    } finally {
      await deleteAuthUserByEmail(email);
    }
  });
});
