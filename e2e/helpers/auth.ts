import { expect, type Page } from "@playwright/test";

export async function loginViaUi(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/auth/login");
  const form = page.locator("form").filter({
    has: page.getByPlaceholder("you@example.com"),
  });

  await form.getByPlaceholder("you@example.com").fill(email);
  await form.locator('input[type="password"]').first().fill(password);
  await form.getByRole("button", { name: /^sign in$/i }).click();

  // Leave /auth/login (client redirect or middleware).
  await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), {
    timeout: 25_000,
  });
}

export async function expectLoggedInAsCustomer(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page).not.toHaveURL(/\/admin/);
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
  const form = page.locator("form").filter({
    has: page.getByPlaceholder("you@example.com"),
  });
  await form.getByPlaceholder("you@example.com").fill(email);
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

export async function logoutIfPossible(page: Page): Promise<void> {
  await page.context().clearCookies();
  // Prefer a light route — home compile can be heavy / flaky under parallel next locks.
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
  await page.goto("/auth/login");
}
