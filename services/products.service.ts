import { getCategoryIdBySlug } from "@/repositories/categories.repository";
import {
  getProducts as getProductsRepo,
  getProductBySlug as getProductBySlugRepo,
} from "@/repositories/product.repository";
import type { ProductWithRelations } from "@/types/product";

export interface GetProductsParams {
  categorySlug?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

/**
 * Get products with filters (category by slug, sort, pagination, search).
 */
export async function getProducts(
  params: GetProductsParams = {},
): Promise<{ data: ProductWithRelations[]; count: number }> {
  const { categorySlug, sort, page = 1, pageSize = 12, search } = params;

  let categoryId: string | null = null;
  if (categorySlug) {
    categoryId = await getCategoryIdBySlug(categorySlug);
  }

  return getProductsRepo({
    categoryId,
    sort,
    page,
    pageSize,
    search,
  });
}

/**
 * Get a single product by slug with relations.
 */
export async function getProductBySlug(
  slug: string,
): Promise<ProductWithRelations | null> {
  return getProductBySlugRepo(slug);
}
