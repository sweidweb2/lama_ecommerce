import { expect, type Page } from "@playwright/test";

async function clickFirstEnabled(
  locator: ReturnType<Page["locator"]>,
): Promise<boolean> {
  const count = await locator.count();
  for (let i = 0; i < count; i += 1) {
    const btn = locator.nth(i);
    if (await btn.isEnabled()) {
      await btn.click();
      return true;
    }
  }
  return false;
}

/**
 * Open the first product from the catalog. Returns false if the catalog is empty.
 */
export async function openFirstProduct(page: Page): Promise<boolean> {
  await page.goto("/products");
  const productLink = page.locator('a[href^="/products/"]').first();
  if ((await productLink.count()) === 0) {
    return false;
  }
  await productLink.click();
  await expect(page).toHaveURL(/\/products\/[^/]+/);
  return true;
}

/** Click the first enabled color / size / material control on the PDP. */
export async function selectFirstAvailableVariant(page: Page): Promise<void> {
  const colorClicked = await clickFirstEnabled(
    page.getByRole("button", { name: /select color/i }),
  );

  const sizeSection = page
    .locator("div.space-y-3")
    .filter({ has: page.getByText("Size", { exact: true }) });
  const sizeClicked = await clickFirstEnabled(sizeSection.getByRole("button"));

  const materialSection = page
    .locator("div.space-y-3")
    .filter({ has: page.getByText("Material", { exact: true }) });
  await clickFirstEnabled(materialSection.getByRole("button"));

  // Some products only expose color or size; require at least one selection.
  if (!colorClicked && !sizeClicked) {
    throw new Error("PDP had no enabled color/size controls to select");
  }

  await expect(
    page.getByText(/in stock|out of stock/i).first(),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/in stock/i).first()).toBeVisible({
    timeout: 5_000,
  });
}

export async function addSelectedVariantToCart(page: Page): Promise<void> {
  await page.getByRole("button", { name: /^add to cart$/i }).click();
  await expect(page.getByText("Added to cart").first()).toBeVisible({
    timeout: 15_000,
  });
}

export async function addSelectedVariantToWishlist(page: Page): Promise<void> {
  await page.getByRole("button", { name: /add to wishlist/i }).click();
  await expect(page.getByRole("button", { name: /in wishlist/i })).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Select first available color/size/material in the admin Add Cart Item dialog.
 * Admin modal uses "select size" aria-labels and a material combobox (unlike PDP).
 */
export async function selectFirstAvailableAdminCartVariant(
  page: Page,
): Promise<void> {
  await clickFirstEnabled(page.getByRole("button", { name: /select color/i }));
  await clickFirstEnabled(page.getByRole("button", { name: /select size/i }));

  const materialTrigger = page
    .locator("div")
    .filter({ has: page.getByText(/^material/i) })
    .getByRole("combobox")
    .first();
  if ((await materialTrigger.count()) > 0) {
    await materialTrigger.click();
    const enabled = page.locator('[role="option"]:not([data-disabled])');
    if ((await enabled.count()) > 0) {
      await enabled.first().click();
    } else {
      await page.getByRole("option").first().click();
    }
  }
}
