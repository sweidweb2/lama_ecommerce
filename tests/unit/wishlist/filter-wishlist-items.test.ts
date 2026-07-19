import { describe, expect, it } from "vitest";
import { filterWishlistItems } from "@/lib/wishlist/filter-wishlist-items";
import type { ProductWithRelations } from "@/types/product";

function item(overrides: {
  isUnavailable?: boolean;
  product?: Partial<ProductWithRelations> | null;
  unitPrice?: number;
}) {
  const isUnavailable = overrides.isUnavailable ?? false;
  const product = isUnavailable
    ? null
    : ({
        id: "p1",
        name: "Tee",
        price: 50,
        is_featured: false,
        is_trending: false,
        category_id: "c1",
        category: { id: "c1", name: "Tops", slug: "tops" },
        ...overrides.product,
      } as ProductWithRelations);
  return {
    wishlist_id: "w1",
    isUnavailable,
    product,
    unitPrice:
      overrides.unitPrice ??
      (isUnavailable ? 0 : (product?.price ?? 0)),
  };
}

describe("filterWishlistItems", () => {
  it("keeps unavailable items when no product filters are set", () => {
    const items = [
      item({ product: { is_featured: true } }),
      item({ isUnavailable: true }),
    ];
    expect(filterWishlistItems(items, {})).toHaveLength(2);
  });

  it("excludes unavailable items from featured filter", () => {
    const items = [
      item({ product: { is_featured: true } }),
      item({ product: { is_featured: false } }),
      item({ isUnavailable: true }),
    ];
    const featured = filterWishlistItems(items, { featured: "true" });
    expect(featured).toHaveLength(1);
    expect(featured[0].product?.is_featured).toBe(true);

    const notFeatured = filterWishlistItems(items, { featured: "false" });
    expect(notFeatured).toHaveLength(1);
    expect(notFeatured[0].product?.is_featured).toBe(false);
  });

  it("filters trending correctly", () => {
    const items = [
      item({ product: { is_trending: true } }),
      item({ product: { is_trending: false } }),
    ];
    expect(filterWishlistItems(items, { trending: "true" })).toHaveLength(1);
  });

  it("filters price range by unitPrice, not base product.price", () => {
    const items = [
      item({ product: { price: 100 }, unitPrice: 40 }),
      item({ product: { price: 40 }, unitPrice: 100 }),
    ];
    const filtered = filterWishlistItems(items, { priceRange: "0-50" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].unitPrice).toBe(40);
  });
});
