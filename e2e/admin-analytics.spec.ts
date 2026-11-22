import { test, expect } from "@playwright/test";
import { e2eAdmin, e2eEnabled, e2eUser } from "./helpers/env";
import {
  expectLoggedInAsCustomer,
  loginViaUi,
  logoutIfPossible,
  tryLoginAsAdmin,
} from "./helpers/auth";
import { e2eDbReady, ensureE2eCustomer } from "./helpers/db";

/**
 * Block 13 — Admin shell & analytics
 */
test.describe("Block 13 — admin shell & analytics", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");

  test("guest visiting /admin is sent to login", async ({ page }) => {
    await logoutIfPossible(page);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page).toHaveURL(/redirect=/);
  });

  test("customer visiting /admin is sent home", async ({ page }) => {
    let email = e2eUser.email();
    let password = e2eUser.password();
    if (!email || !password) {
      test.skip(!e2eDbReady(), "Set E2E_USER_* or Supabase service role");
      const customer = await ensureE2eCustomer();
      email = customer.email;
      password = customer.password;
    } else {
      await ensureE2eCustomer({ email, password });
    }

    await logoutIfPossible(page);
    await loginViaUi(page, email, password);
    await expectLoggedInAsCustomer(page);

    await page.goto("/admin");
    await expect(page).toHaveURL((url) => url.pathname === "/");
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test("admin sees analytics KPIs and date presets update URL", async ({
    page,
  }) => {
    test.skip(!e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    await logoutIfPossible(page);
    const ok = await tryLoginAsAdmin(
      page,
      e2eAdmin.email()!,
      e2eAdmin.password()!,
    );
    expect(ok, "admin login failed").toBe(true);

    await expect(page.getByRole("heading", { name: /^analytics$/i })).toBeVisible();
    await expect(page.getByText(/^active users$/i).first()).toBeVisible();
    await expect(page.getByText(/^active products$/i).first()).toBeVisible();
    await expect(
      page.getByRole("alert").filter({
        hasText: /some analytics data could not be loaded/i,
      }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: /last 30 days/i }).click();
    await expect(page).toHaveURL(/preset=last_30d/);
    await expect(page.getByRole("heading", { name: /^analytics$/i })).toBeVisible();

    await page.getByRole("button", { name: /this month/i }).click();
    await expect(page).toHaveURL(/preset=this_month/);
  });
});
