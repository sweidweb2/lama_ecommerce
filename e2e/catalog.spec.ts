import { test, expect } from "@playwright/test";
import { e2eEnabled } from "./helpers/env";

/**
 * Block 4 — Catalog browse & search
 */
test.describe("Block 4 — catalog browse & search", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");

  test("products page loads grid or empty state", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/\/products/);

    const productLink = page.locator('a[href^="/products/"]').first();
    const empty = page.getByRole("heading", { name: /no products found/i });

    const hasProducts = (await productLink.count()) > 0;
    if (hasProducts) {
      await expect(productLink).toBeVisible();
    } else {
      await expect(empty).toBeVisible();
    }
  });

  test("unknown category slug shows empty grid (no crash)", async ({
    page,
  }) => {
    await page.goto("/products?category=e2e-missing-category-xyz");
    await expect(page).toHaveURL(/category=e2e-missing-category-xyz/);
    await expect(
      page.getByRole("heading", { name: /no products found/i }),
    ).toBeVisible();
  });

  test("category filter updates URL when categories exist", async ({
    page,
  }) => {
    await page.goto("/products");
    const categoryList = page.getByRole("list", { name: /product categories/i });
    const categoryButtons = categoryList.getByRole("button");
    const count = await categoryButtons.count();
    test.skip(count === 0, "No categories to filter — seed categories first");

    // Skip "All" (first) if present; prefer a real category slug button.
    const target =
      count > 1 ? categoryButtons.nth(1) : categoryButtons.first();
    const name = (await target.innerText()).trim();
    await target.click();
    await expect(page).toHaveURL(/category=/);
    await expect(page.getByRole("button", { name })).toBeVisible();
  });

  test("pagination navigates when multiple pages exist", async ({ page }) => {
    await page.goto("/products");
    const next = page.getByRole("button", { name: /next page/i }).first();
    if ((await next.count()) === 0 || (await next.isDisabled())) {
      test.skip(true, "Only one products page — seed more products for pagination");
    }

    await next.click();
    await expect(page).toHaveURL(/page=2/);
    await expect(
      page.getByRole("button", { name: "2", exact: true }).first(),
    ).toHaveAttribute("aria-current", "page");
  });

  test("search with q shows results count or zero-state", async ({ page }) => {
    await page.goto("/search?q=e2e-unlikely-query-zzz");
    await expect(page.getByRole("heading", { name: /^search$/i })).toBeVisible();
    await expect(page.getByText(/0 results/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /no products found/i }),
    ).toBeVisible();
  });

  test("search with real product token when catalog has items", async ({
    page,
  }) => {
    await page.goto("/products");
    const productLink = page.locator('a[href^="/products/"]').first();
    if ((await productLink.count()) === 0) {
      test.skip(true, "No products to search");
    }

    const href = (await productLink.getAttribute("href")) || "";
    const slug = href.split("/products/")[1]?.split("?")[0] || "";
    test.skip(!slug, "Could not read product slug");

    const token = slug.split("-")[0] || slug;
    await page.goto(`/search?q=${encodeURIComponent(token)}`);
    await expect(page.getByText(/\d+ results?/i).first()).toBeVisible();
  });
});
