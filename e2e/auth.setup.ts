import fs from "node:fs";
import { test as setup, expect } from "@playwright/test";
import { e2eAdmin, e2eEnabled, e2eUser } from "./helpers/env";
import {
  expectLoggedInAsAdmin,
  expectLoggedInAsCustomer,
  loginViaUi,
  logoutIfPossible,
} from "./helpers/auth";
import {
  createUniqueE2eCustomer,
  e2eDbReady,
  ensureE2eCustomer,
} from "./helpers/db";
import {
  adminAuthFile,
  authDir,
  customerAuthFile,
} from "./helpers/paths";

const emptyState = { cookies: [], origins: [] };

function writeEmpty(filePath: string): void {
  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(emptyState));
}

setup.describe("auth setup", () => {
  setup.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");
  setup.setTimeout(120_000);

  setup("authenticate as admin", async ({ page }) => {
    fs.mkdirSync(authDir, { recursive: true });
    if (!e2eAdmin.ready()) {
      writeEmpty(adminAuthFile);
      setup.skip(true, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
      return;
    }
    await logoutIfPossible(page);
    await loginViaUi(page, e2eAdmin.email()!, e2eAdmin.password()!);
    await expectLoggedInAsAdmin(page);
    await expect(page).toHaveURL(/\/admin\/analytics/);
    await page.context().storageState({ path: adminAuthFile });
  });

  setup("authenticate as customer", async ({ page }) => {
    fs.mkdirSync(authDir, { recursive: true });
    if (!e2eDbReady() && !e2eUser.ready()) {
      writeEmpty(customerAuthFile);
      setup.skip(true, "Set E2E_USER_* or Supabase service role");
      return;
    }

    const customer = e2eUser.ready()
      ? await ensureE2eCustomer({
          email: e2eUser.email()!,
          password: e2eUser.password()!,
        })
      : await createUniqueE2eCustomer("e2e-auth");

    await logoutIfPossible(page);
    try {
      await loginViaUi(page, customer.email, customer.password);
    } catch {
      // One retry after a fresh cookie clear (flaky Supabase client hang).
      await logoutIfPossible(page);
      await loginViaUi(page, customer.email, customer.password);
    }
    await page.goto("/");
    await expectLoggedInAsCustomer(page);
    await page.context().storageState({ path: customerAuthFile });
  });
});
