import { z } from "zod";
import {
  createProductVariant,
  updateProductVariant,
  softDeleteProductVariant,
  hardDeleteProductVariant,
  getProductVariantById,
  getProductVariantsByProductId,
  type CreateProductVariantInput,
  type UpdateProductVariantInput,
} from "@/repositories/product_variant.repository";
import { createProductVariantSchema } from "@/lib/validators/product_variant/create";
import { updateProductVariantSchema } from "@/lib/validators/product_variant/update";
import type { ProductVariant } from "@/types/product";

/**
 * Create a new product variant (admin).
 */
export async function createProductVariantService(
  input: z.infer<typeof createProductVariantSchema>,
): Promise<ProductVariant | null> {
  const repoInput: CreateProductVariantInput = {
    product_id: input.product_id,
    color: input.color ?? null,
    size: input.size ?? null,
    material: input.material ?? null,
    quantity_stock: input.quantity_stock ?? 0,
    sku_variant: input.sku_variant ?? null,
    price_override: input.price_override ?? null,
  };

  return createProductVariant(repoInput);
}

/**
 * Update an existing product variant (admin).
 */
export async function updateProductVariantService(
  id: string,
  input: z.infer<typeof updateProductVariantSchema>,
): Promise<ProductVariant | null> {
  const repoInput: UpdateProductVariantInput = {
    product_id: input.product_id,
    color: input.color,
    size: input.size,
    material: input.material,
    quantity_stock: input.quantity_stock,
    sku_variant: input.sku_variant,
    price_override: input.price_override,
  };

  return updateProductVariant(id, repoInput);
}

/**
 * Get a product variant by ID.
 */
export async function getProductVariantByIdService(
  id: string,
): Promise<ProductVariant | null> {
  return getProductVariantById(id);
}

/**
 * Get all variants for a product.
 */
export async function getProductVariantsByProductIdService(
  productId: string,
): Promise<ProductVariant[]> {
  return getProductVariantsByProductId(productId);
}

/**
 * Delete a product variant (soft delete).
 */
export async function deleteProductVariantService(
  id: string,
): Promise<boolean> {
  return softDeleteProductVariant(id);
}
