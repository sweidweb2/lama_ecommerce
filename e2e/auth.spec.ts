import { test, expect } from "@playwright/test";
import {
  e2eAdmin,
  e2eEnabled,
  e2eInactive,
  e2eUser,
} from "./helpers/env";
import {
  expectLoggedInAsAdmin,
  expectLoggedInAsCustomer,
  loginViaUi,
  logoutIfPossible,
} from "./helpers/auth";

/**
 * Block 1 — Auth
 *
 * Credentials (optional; tests skip when missing):
 *   E2E_USER_EMAIL / E2E_USER_PASSWORD
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 *   E2E_INACTIVE_EMAIL / E2E_INACTIVE_PASSWORD
 */
test.describe("Block 1 — auth", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");

  test("signup shows validation errors for bad input", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByRole("heading", { name: /create an account/i })).toBeVisible();
    await page.getByPlaceholder("John Doe").fill("A");
    await page.getByPlaceholder("you@example.com").fill("not-an-email");
    await page.getByPlaceholder("••••••••").fill("short");
    // Bypass native HTML5 so Zod messages surface (email type blocks submit otherwise).
    const signupForm = page.locator("form").filter({ hasText: /full name/i });
    await signupForm.evaluate((form) => {
      (form as HTMLFormElement).noValidate = true;
    });
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page.getByText(/at least 2 characters/i).first()).toBeVisible();
    await expect(page.getByText(/valid email/i).first()).toBeVisible();
    await expect(page.getByText(/at least 8 characters/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test("reset password always shows success (anti-enumeration)", async ({
    page,
  }) => {
    await page.goto("/auth/reset-password");
    await expect(
      page.getByRole("heading", { name: /reset your password/i }),
    ).toBeVisible();
    await page.getByPlaceholder("you@example.com").fill("nobody-e2e@example.com");
    await page.getByRole("button", { name: /send reset link/i }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible();
    await expect(
      page.getByRole("main").getByText(/if an account exists for that address/i),
    ).toBeVisible();
  });

  test("customer login lands on home", async ({ page }) => {
    test.skip(!e2eUser.ready(), "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");
    await logoutIfPossible(page);
    await loginViaUi(page, e2eUser.email()!, e2eUser.password()!);
    await expectLoggedInAsCustomer(page);
    await expect(page).toHaveURL((url) => url.pathname === "/");
  });

  test("admin login lands on analytics", async ({ page }) => {
    test.skip(!e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    await logoutIfPossible(page);
    await loginViaUi(page, e2eAdmin.email()!, e2eAdmin.password()!);
    await expectLoggedInAsAdmin(page);
  });

  test("inactive login is rejected", async ({ page }) => {
    test.skip(
      !e2eInactive.ready(),
      "Set E2E_INACTIVE_EMAIL and E2E_INACTIVE_PASSWORD",
    );
    await logoutIfPossible(page);
    await loginViaUi(page, e2eInactive.email()!, e2eInactive.password()!);
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(
      page.getByText(/deactivated|inactive|contact support/i).first(),
    ).toBeVisible();
  });

  test("already logged-in customer cannot open login", async ({ page }) => {
    test.skip(!e2eUser.ready(), "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");
    await logoutIfPossible(page);
    await loginViaUi(page, e2eUser.email()!, e2eUser.password()!);
    await expectLoggedInAsCustomer(page);

    await page.goto("/auth/login");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page).toHaveURL((url) => url.pathname === "/");
  });

  test("open-redirect query is sanitized after login", async ({ page }) => {
    test.skip(!e2eUser.ready(), "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");
    await logoutIfPossible(page);
    await page.goto("/auth/login?redirect=https://evil.example");
    await page.getByPlaceholder("you@example.com").fill(e2eUser.email()!);
    await page.getByPlaceholder("••••••••").fill(e2eUser.password()!);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expectLoggedInAsCustomer(page);
    await expect(page).toHaveURL((url) => url.pathname === "/");
    await expect(page).not.toHaveURL(/evil\.example/);
  });
});
