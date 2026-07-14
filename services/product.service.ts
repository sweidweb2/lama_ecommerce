import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createProductSchema } from "@/lib/validators/product/create";
import {
  updateProductSchema,
  type UpdateProductInput,
} from "@/lib/validators/product/update";
import {
  createProduct,
  getAdminProducts,
  getProducts as getProductsRepo,
  getProductPriceBounds,
  getProductVariantFacets,
  getRelatedProducts,
  type CreateProductRepoInput,
  type GetProductsRepoParams,
  type ProductVariantFacets,
  updateProduct,
  type UpdateProductRepoInput,
  hardDeleteProduct,
  getProductById,
} from "@/repositories/product.repository";
import { getCategoryIdBySlug } from "@/repositories/categories.repository";
import { getBrandIdBySlug } from "@/repositories/brand.repository";
import type { Product, ProductWithRelations } from "@/types/product";

/**
 * Create a new product as admin.
 */
export async function createProductService(
  input: z.infer<typeof createProductSchema>,
  ownerId: string,
): Promise<Product | null> {
  await requireAdmin();
  const payload = createProductSchema.parse(input);

  const repoInput: CreateProductRepoInput = {
    name: payload.name,
    description: payload.description ?? null,
    slug: payload.slug,
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
  await requireAdmin();
  const payload = updateProductSchema.parse(input);

  const repoInput: UpdateProductRepoInput = {
    name: payload.name,
    description:
      payload.description === undefined ? undefined : payload.description ?? null,
    slug: payload.slug === undefined ? undefined : payload.slug,
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
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return getAdminProducts();
}

/**
 * Get a single product (with relations) for the admin detail page by ID.
 */
export async function getAdminProductByIdService(
  id: string,
): Promise<ProductWithRelations | null> {
  try {
    await requireAdmin();
  } catch {
    return null;
  }
  return getProductById(id);
}

/**
 * Hard-delete a product as admin.
 * Refuses when blocking FK children exist (questions, views, stats, wishlist/cart on variants).
 */
export async function deleteProductService(id: string): Promise<boolean> {
  try {
    await requireAdmin();
  } catch {
    return false;
  }
  return hardDeleteProduct(id);
}

export interface GetProductsServiceParams {
  categorySlug?: string;
  brandSlug?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  colors?: string[];
  sizes?: string[];
}

/**
 * Public storefront products fetch.
 */
export async function getProducts(
  params: GetProductsServiceParams = {},
): Promise<{ data: ProductWithRelations[]; count: number }> {
  const {
    categorySlug,
    brandSlug,
    sort,
    page = 1,
    pageSize = 12,
    search,
    minPrice,
    maxPrice,
    isFeatured,
    isTrending,
    colors,
    sizes,
  } = params;

  let categoryId: string | null = null;
  let brandId: string | null = null;

  if (categorySlug) {
    categoryId = await getCategoryIdBySlug(categorySlug);
    if (!categoryId) {
      return { data: [], count: 0 };
    }
  }

  if (brandSlug) {
    brandId = await getBrandIdBySlug(brandSlug);
    if (!brandId) {
      return { data: [], count: 0 };
    }
  }

  const repoParams: GetProductsRepoParams = {
    categoryId,
    brandId,
    sort,
    page,
    pageSize,
    search,
    minPrice,
    maxPrice,
    isFeatured,
    isTrending,
    colors,
    sizes,
  };

  return getProductsRepo(repoParams);
}

/**
 * Distinct color / size facet values for the storefront filters.
 */
export async function getProductVariantFacetsService(): Promise<ProductVariantFacets> {
  return getProductVariantFacets();
}

/**
 * Price slider bounds for the products listing.
 */
export async function getProductPriceBoundsService(): Promise<{
  minPrice: number;
  maxPrice: number;
}> {
  return getProductPriceBounds();
}

/**
 * Related products for a product detail page (tiered, bounded queries).
 */
export async function getRelatedProductsService(
  product: {
    id: string;
    brand_id: string | null;
    category_id: string | null;
  },
  limit = 12,
): Promise<ProductWithRelations[]> {
  return getRelatedProducts(product, limit);
}