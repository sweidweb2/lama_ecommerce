import { z } from "zod";
import { createProductSchema } from "@/lib/validators/product/create";
import {
  createProduct,
  getAdminProducts,
  type CreateProductRepoInput,
} from "@/repositories/product.repository";
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
 * Get all products for admin listing.
 */
export async function getAdminProductsService(): Promise<ProductWithRelations[]> {
  return getAdminProducts();
}