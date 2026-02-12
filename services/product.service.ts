import { z } from "zod";
import { createProductSchema } from "@/lib/validators/product/create";
import {
  updateProductSchema,
  type UpdateProductInput,
} from "@/lib/validators/product/update";
import {
  createProduct,
  getAdminProducts,
  getProducts as getProductsRepo,
  type CreateProductRepoInput,
  type GetProductsRepoParams,
  updateProduct,
  type UpdateProductRepoInput,
  hasProductRelations,
  softDeleteProduct,
  hardDeleteProduct,
} from "@/repositories/product.repository";
import { getCategoryIdBySlug } from "@/repositories/categories.repository";
import type { Product, ProductWithRelations } from "@/types/product";

/**
 * Create a new product as admin.
 */
export async function createProductService(
  input: z.infer<typeof createProductSchema>,
  ownerId: string,
): Promise<Product | null> {
  const payload = createProductSchema.parse(input);

  const repoInput: CreateProductRepoInput = {
    name: payload.name,
    description: payload.description ?? null,
    slug: payload.slug ?? null,
    brand_id: payload.brand_id ?? null,
    category_id: payload.category_id ?? null,
    sku: payload.sku ?? null,
    price: payload.price,
    is_featured: payload.is_featured ?? false,
    is_trending: payload.is_trending ?? false,
    owner_id: ownerId,
  };

  return createProduct(repoInput);
}

/**
 * Update an existing product as admin.
 */
export async function updateProductService(
  id: string,
  input: UpdateProductInput,
): Promise<Product | null> {
  const payload = updateProductSchema.parse(input);

  const repoInput: UpdateProductRepoInput = {
    name: payload.name,
    description:
      payload.description === undefined ? undefined : payload.description ?? null,
    slug: payload.slug === undefined ? undefined : payload.slug ?? null,
    brand_id: payload.brand_id === undefined ? undefined : payload.brand_id ?? null,
    category_id:
      payload.category_id === undefined ? undefined : payload.category_id ?? null,
    sku: payload.sku === undefined ? undefined : payload.sku ?? null,
    price: payload.price,
    is_featured: payload.is_featured,
    is_trending: payload.is_trending,
    is_active: payload.is_active,
  };

  return updateProduct(id, repoInput);
}

/**
 * Get all products for admin listing.
 */
export async function getAdminProductsService(): Promise<ProductWithRelations[]> {
  return getAdminProducts();
}

/**
 * Delete a product as admin.
 *
 * - If there are no related rows, perform a soft delete (set deleted_at, is_active=false).
 * - If there are related rows, return "hard" so the caller can handle storage
 *   cleanup first, then perform a hard delete.
 *
 * Returns:
 * - "soft" if soft-deleted
 * - "hard" if hard-deleted
 * - null if the operation failed
 */
export async function deleteProductService(
  id: string,
): Promise<"soft" | "hard" | null> {
  const related = await hasProductRelations(id);

  if (!related) {
    const ok = await softDeleteProduct(id);
    return ok ? "soft" : null;
  }

  // Caller will do storage cleanup first, then call hardDeleteProductService.
  return "hard";
}

/**
 * Perform a hard delete of a product (DB only).
 * Intended to be called after storage cleanup has succeeded or at least been attempted.
 */
export async function hardDeleteProductService(id: string): Promise<boolean> {
  return hardDeleteProduct(id);
}

export interface GetProductsServiceParams {
  categorySlug?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

/**
 * Public storefront products fetch.
 */
export async function getProducts(
  params: GetProductsServiceParams = {},
): Promise<{ data: ProductWithRelations[]; count: number }> {
  const { categorySlug, sort, page = 1, pageSize = 12, search } = params;

  let categoryId: string | null = null;

  if (categorySlug) {
    categoryId = await getCategoryIdBySlug(categorySlug);
  }

  const repoParams: GetProductsRepoParams = {
    categoryId,
    sort,
    page,
    pageSize,
    search,
  };

  return getProductsRepo(repoParams);
}