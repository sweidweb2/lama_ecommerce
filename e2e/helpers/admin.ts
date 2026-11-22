import { expect, type Page } from "@playwright/test";
import { encryptOrderId } from "@/lib/utils/encryption";
import { e2eAdmin } from "./env";
import {
  expectLoggedInAsAdmin,
  loginViaUi,
  logoutIfPossible,
} from "./auth";

/** Login as E2E admin (skips must be handled by the caller via e2eAdmin.ready()). */
export async function loginAsAdmin(page: Page): Promise<void> {
  await logoutIfPossible(page);
  await loginViaUi(page, e2eAdmin.email()!, e2eAdmin.password()!);
  await expectLoggedInAsAdmin(page);
}

export function adminOrderPath(orderId: string): string {
  return `/admin/orders/${encryptOrderId(orderId)}`;
}

export function adminCartPath(cartId: string): string {
  return `/admin/carts/${encryptOrderId(cartId)}`;
}

/** Confirm a Radix select option by visible name. */
export async function selectOption(
  page: Page,
  trigger: ReturnType<Page["locator"]>,
  optionName: string | RegExp,
): Promise<void> {
  await trigger.click();
  await page.getByRole("option", { name: optionName }).click();
}

export async function expectToast(
  page: Page,
  text: string | RegExp,
): Promise<void> {
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 20_000 });
}
