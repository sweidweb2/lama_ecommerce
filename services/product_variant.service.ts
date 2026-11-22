import { z } from "zod";
import {
  createProductVariant,
  updateProductVariant,
  hardDeleteProductVariant,
  getProductVariantById,
  getProductVariantsByProductId,
  getProductVariantsByProductIds,
  getVariantOrderedQuantity,
  type CreateProductVariantInput,
  type UpdateProductVariantInput,
} from "@/repositories/product_variant.repository";
import { createProductVariantSchema } from "@/lib/validators/product_variant/create";
import { updateProductVariantSchema } from "@/lib/validators/product_variant/update";
import { canonicalizeColorForStorage } from "@/lib/constants/color-palette";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { ProductVariant } from "@/types/product";

/**
 * Create a new product variant (admin).
 */
export async function createProductVariantService(
  input: z.infer<typeof createProductVariantSchema>,
): Promise<ProductVariant | null> {
  await requireAdmin();

  const repoInput: CreateProductVariantInput = {
    product_id: input.product_id,
    color: input.color
      ? canonicalizeColorForStorage(input.color)
      : null,
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
 * Stock may be corrected freely (including reductions after sales).
 * Cart "reserved" qty is not a hard block — abandoned carts are not inventory holds.
 */
export async function updateProductVariantService(
  id: string,
  input: z.infer<typeof updateProductVariantSchema>,
): Promise<ProductVariant> {
  await requireAdmin();

  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new Error("Variant ID is required.");
  }

  const existing = await getProductVariantById(id);
  if (!existing) {
    throw new Error("Variant not found.");
  }

  const repoInput: UpdateProductVariantInput = {
    product_id: input.product_id,
    color:
      input.color === undefined
        ? undefined
        : input.color === null
          ? null
          : canonicalizeColorForStorage(input.color),
    size: input.size,
    material: input.material,
    quantity_stock: input.quantity_stock,
    sku_variant: input.sku_variant,
    price_override: input.price_override,
  };

  const updated = await updateProductVariant(id, repoInput);
  if (!updated) {
    throw new Error("Failed to update product variant.");
  }
  return updated;
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
 * Get variants for many products (batched for admin products table).
 */
export async function getProductVariantsByProductIdsService(
  productIds: string[],
): Promise<ProductVariant[]> {
  return getProductVariantsByProductIds(productIds);
}

/**
 * Hard-delete a product variant.
 * Refuses when wishlists, cart_items, or order_items still reference it.
 */
export async function deleteProductVariantService(
  id: string,
): Promise<boolean> {
  await requireAdmin();

  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new Error("Variant ID is required.");
  }

  const orderedQty = await getVariantOrderedQuantity(id);
  if (orderedQty > 0) {
    throw new Error(
      `Cannot delete variant: order history still references it (${orderedQty} unit(s) ordered).`,
    );
  }

  return hardDeleteProductVariant(id);
}
