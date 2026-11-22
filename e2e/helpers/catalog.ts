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
  await clickFirstEnabled(page.getByRole("button", { name: /select color/i }));

  const sizeSection = page
    .locator("div.space-y-3")
    .filter({ has: page.getByText("Size", { exact: true }) });
  await clickFirstEnabled(sizeSection.getByRole("button"));

  const materialSection = page
    .locator("div.space-y-3")
    .filter({ has: page.getByText("Material", { exact: true }) });
  await clickFirstEnabled(materialSection.getByRole("button"));

  await expect(page.getByText(/in stock/i).first()).toBeVisible({
    timeout: 10_000,
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
