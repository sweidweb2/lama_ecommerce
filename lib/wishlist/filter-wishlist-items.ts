import type { ProductWithRelations } from "@/types/product";

export type WishlistFilterableItem = {
  isUnavailable: boolean;
  product: ProductWithRelations | null;
  /** Effective unit price (COALESCE override, base). Used by price-range filter. */
  unitPrice: number;
};

export type WishlistFilterParams = {
  category?: string;
  featured?: string;
  trending?: string;
  priceRange?: string;
};

/**
 * Apply wishlist page filters. Unavailable items only remain when no
 * product-field filter is active (category / featured / trending / price).
 */
export function filterWishlistItems<T extends WishlistFilterableItem>(
  items: T[],
  params: WishlistFilterParams,
): T[] {
  let filtered = [...items];

  const hasCategory = !!params.category && params.category !== "all";
  const hasFeatured = !!params.featured && params.featured !== "all";
  const hasTrending = !!params.trending && params.trending !== "all";
  const hasPrice = !!params.priceRange && params.priceRange !== "all";
  const hasProductFilter = hasCategory || hasFeatured || hasTrending || hasPrice;

  if (hasProductFilter) {
    filtered = filtered.filter((item) => !item.isUnavailable && item.product);
  }

  if (hasCategory) {
    filtered = filtered.filter((item) => {
      const product = item.product!;
      const categorySlug = product.category?.slug;
      const categoryId = product.category?.id || product.category_id;
      return (
        categorySlug === params.category ||
        categoryId === params.category ||
        String(categoryId) === params.category
      );
    });
  }

  if (hasFeatured) {
    const isFeatured = params.featured === "true";
    filtered = filtered.filter(
      (item) => item.product!.is_featured === isFeatured,
    );
  }

  if (hasTrending) {
    const isTrending = params.trending === "true";
    filtered = filtered.filter(
      (item) => item.product!.is_trending === isTrending,
    );
  }

  if (hasPrice) {
    const [min, max] = params.priceRange!.split("-").map((v) => v.replace("+", ""));
    const minPrice = min ? parseFloat(min) : 0;
    const maxPrice = max ? parseFloat(max) : Infinity;

    filtered = filtered.filter((item) => {
      const price = item.unitPrice;
      return price >= minPrice && price <= maxPrice;
    });
  }

  return filtered;
}
