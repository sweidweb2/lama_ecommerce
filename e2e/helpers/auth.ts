import { expect, type Page } from "@playwright/test";

export async function loginViaUi(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/auth/login");
  const form = page.locator("main form").filter({
    has: page.getByPlaceholder("you@example.com"),
  }).first();

  await form.getByPlaceholder("you@example.com").first().fill(email);
  await form.locator('input[type="password"]').first().fill(password);
  await form.getByRole("button", { name: /^sign in$/i }).click();

  // Client may keep /auth/login while AuthProvider already has a session.
  try {
    await Promise.any([
      page
        .waitForURL((url) => !url.pathname.startsWith("/auth/login"), {
          timeout: 25_000,
        })
        .then(() => "navigated" as const),
      page
        .getByRole("button", { name: /open user menu/i })
        .waitFor({ state: "visible", timeout: 25_000 })
        .then(() => "menu" as const),
    ]);
  } catch {
    const loginError = page
      .getByText(/login failed|invalid|incorrect|deactivated|inactive/i)
      .first();
    if (await loginError.isVisible().catch(() => false)) {
      throw new Error(
        `Login failed for ${email}: ${await loginError.innerText()}`,
      );
    }
    throw new Error(`Login did not leave /auth/login for ${email}`);
  }
}

export async function expectLoggedInAsCustomer(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page).not.toHaveURL(/\/admin/);
  // Ensure we are on a page that renders the storefront chrome.
  if (page.url().includes("/auth/")) {
    await page.goto("/");
  }
  await expect(
    page.getByRole("button", { name: /open user menu/i }),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /open user menu/i }).click();
  await expect(page.getByRole("menuitem", { name: /^profile$/i })).toBeVisible({
    timeout: 10_000,
  });
  // Close menu so later interactions are not blocked.
  await page.keyboard.press("Escape");
}

export async function expectLoggedInAsAdmin(page: Page): Promise<void> {
  if (!/\/admin\/analytics/.test(page.url())) {
    await page.goto("/admin/analytics");
  }
  await expect(page).toHaveURL(/\/admin\/analytics/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /^analytics$/i })).toBeVisible({
    timeout: 20_000,
  });
}

/** Login as admin; returns false if credentials fail (stays on /auth/login). */
export async function tryLoginAsAdmin(
  page: Page,
  email: string,
  password: string,
): Promise<boolean> {
  await page.goto("/auth/login");
  const form = page.locator("main form").filter({
    has: page.getByPlaceholder("you@example.com"),
  }).first();
  await form.getByPlaceholder("you@example.com").first().fill(email);
  await form.locator('input[type="password"]').first().fill(password);
  await form.getByRole("button", { name: /^sign in$/i }).click();

  try {
    await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), {
      timeout: 25_000,
    });
  } catch {
    return false;
  }

  if (!/\/admin/.test(page.url())) {
    await page.goto("/admin/analytics");
  }
  try {
    await expect(page).toHaveURL(/\/admin\/analytics/, { timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

/** Clear session cookies/storage and land on login (single navigation). */
export async function logoutIfPossible(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/auth/login");
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
  });
  await page.context().clearCookies();
}
