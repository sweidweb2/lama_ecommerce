import { describe, expect, it } from "vitest";
import {
  ADMIN_PRODUCTS_TABLE_PAGE_SIZE,
  parseAdminProductsListParams,
} from "@/lib/admin/products-list-params";

describe("parseAdminProductsListParams", () => {
  it("maps category, brand, active, featured, trending, and stock query params", () => {
    const result = parseAdminProductsListParams(
      {
        page: "2",
        category: "cat-1",
        brand: "brand-1",
        active: "true",
        featured: "false",
        trending: "true",
        stock: "low",
      },
      ADMIN_PRODUCTS_TABLE_PAGE_SIZE,
    );

    expect(result).toEqual({
      page: 2,
      pageSize: ADMIN_PRODUCTS_TABLE_PAGE_SIZE,
      categoryId: "cat-1",
      brandId: "brand-1",
      isFeatured: false,
      isTrending: true,
      isActive: true,
      stock: "low",
    });
  });

  it("treats all / missing filter values as unbound", () => {
    const result = parseAdminProductsListParams(
      {
        category: "all",
        brand: "all",
        stock: "nope",
      },
      12,
    );

    expect(result.categoryId).toBeNull();
    expect(result.brandId).toBeNull();
    expect(result.isActive).toBeNull();
    expect(result.isFeatured).toBeNull();
    expect(result.isTrending).toBeNull();
    expect(result.stock).toBe("all");
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(12);
  });
});
