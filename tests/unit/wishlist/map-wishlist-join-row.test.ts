import { describe, expect, it } from "vitest";
import { mapWishlistJoinRow } from "@/repositories/wishlist.repository";

function baseRow(overrides: {
  products?: Record<string, unknown> | null;
  customised_products?: null;
  price_override?: number | string | null;
} = {}) {
  if (overrides.customised_products === null) {
    return {
      id: "wish-1",
      customised_product_id: "cp-1",
      customised_products: null,
    };
  }

  return {
    id: "wish-1",
    customised_product_id: "cp-1",
    customised_products: {
      id: "cp-1",
      color: "Black",
      size: "M",
      material: null,
      price_override:
        overrides.price_override === undefined ? null : overrides.price_override,
      products:
        overrides.products === undefined
          ? {
              id: "prod-1",
              name: "Tee",
              slug: "tee",
              description: null,
              price: 40,
              is_active: true,
              is_featured: true,
              is_trending: false,
              brand_id: "b1",
              category_id: "c1",
              brands: { id: "b1", name: "Brand", slug: "brand" },
              categories: { id: "c1", name: "Tops", slug: "tops" },
              product_images: [],
            }
          : overrides.products,
    },
  };
}

describe("mapWishlistJoinRow", () => {
  it("maps active products with featured/trending flags", () => {
    const mapped = mapWishlistJoinRow(baseRow());
    expect(mapped).not.toBeNull();
    expect(mapped!.isUnavailable).toBe(false);
    expect(mapped!.unitPrice).toBe(40);
    expect(mapped!.product).toMatchObject({
      name: "Tee",
      is_featured: true,
      is_trending: false,
      brand: { id: "b1", name: "Brand", slug: "brand" },
      category: { id: "c1", name: "Tops", slug: "tops" },
    });
  });

  it("uses price_override as unitPrice when set", () => {
    const mapped = mapWishlistJoinRow(baseRow({ price_override: 29.5 }));
    expect(mapped).not.toBeNull();
    expect(mapped!.unitPrice).toBe(29.5);
  });

  it("keeps rows when products embed is null (RLS / deleted)", () => {
    const mapped = mapWishlistJoinRow(baseRow({ products: null }));
    expect(mapped).not.toBeNull();
    expect(mapped!.isUnavailable).toBe(true);
    expect(mapped!.product).toBeNull();
    expect(mapped!.unitPrice).toBe(0);
    expect(mapped!.variant.id).toBe("cp-1");
    expect(mapped!.wishlist_id).toBe("wish-1");
  });

  it("keeps inactive products as unavailable placeholders", () => {
    const mapped = mapWishlistJoinRow(
      baseRow({
        products: {
          id: "prod-1",
          name: "Old Tee",
          price: 40,
          is_active: false,
          is_featured: true,
          is_trending: true,
        },
      }),
    );
    expect(mapped).not.toBeNull();
    expect(mapped!.isUnavailable).toBe(true);
    expect(mapped!.product).toBeNull();
    expect(mapped!.unitPrice).toBe(0);
  });

  it("drops rows when customised_products join is missing", () => {
    expect(mapWishlistJoinRow(baseRow({ customised_products: null }))).toBeNull();
  });
});
