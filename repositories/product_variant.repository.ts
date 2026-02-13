import {
  createSupabaseServerActionClient,
  createSupabaseServerComponentClient,
} from "@/lib/supabase/server";
import type { ProductVariant } from "@/types/product";

export interface CreateProductVariantInput {
  product_id: string;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  quantity_stock?: number;
  sku_variant?: string | null;
  price_override?: number | null;
}

export interface UpdateProductVariantInput {
  product_id?: string;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  quantity_stock?: number;
  sku_variant?: string | null;
  price_override?: number | null;
}

/**
 * Create a new product variant (customised product).
 */
export async function createProductVariant(
  input: CreateProductVariantInput,
): Promise<ProductVariant | null> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { data, error } = await supabase
      .from("customised_products")
      .insert([
        {
          product_id: input.product_id,
          color: input.color ?? null,
          size: input.size ?? null,
          material: input.material ?? null,
          quantity_stock: input.quantity_stock ?? 0,
          sku_variant: input.sku_variant ?? null,
          price_override: input.price_override ?? null,
        },
      ] as any)
      .select("*")
      .single();

    if (error) {
      console.error("Error creating product variant:", error);
      return null;
    }

    return (data ?? null) as ProductVariant | null;
  } catch (error) {
    console.error("Unexpected error in createProductVariant:", error);
    return null;
  }
}

/**
 * Update an existing product variant.
 */
export async function updateProductVariant(
  id: string,
  input: UpdateProductVariantInput,
): Promise<ProductVariant | null> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const updateData: any = {};
    if (input.product_id !== undefined) updateData.product_id = input.product_id;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.size !== undefined) updateData.size = input.size;
    if (input.material !== undefined) updateData.material = input.material;
    if (input.quantity_stock !== undefined) updateData.quantity_stock = input.quantity_stock;
    if (input.sku_variant !== undefined) updateData.sku_variant = input.sku_variant;
    if (input.price_override !== undefined) updateData.price_override = input.price_override;

    const { data, error } = await (supabase as any)
      .from("customised_products")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating product variant:", error);
      return null;
    }

    return (data ?? null) as ProductVariant | null;
  } catch (error) {
    console.error("Unexpected error in updateProductVariant:", error);
    return null;
  }
}

/**
 * Get a product variant by ID.
 */
export async function getProductVariantById(
  id: string,
): Promise<ProductVariant | null> {
  try {
    const supabase = await createSupabaseServerComponentClient();

    const { data, error } = await supabase
      .from("customised_products")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      console.error("Error fetching product variant:", error);
      return null;
    }

    return (data ?? null) as ProductVariant | null;
  } catch (error) {
    console.error("Unexpected error in getProductVariantById:", error);
    return null;
  }
}

/**
 * Get all variants for a specific product.
 */
export async function getProductVariantsByProductId(
  productId: string,
): Promise<ProductVariant[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();

    const { data, error } = await supabase
      .from("customised_products")
      .select("*")
      .eq("product_id", productId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching product variants:", error);
      return [];
    }

    return (data ?? []) as ProductVariant[];
  } catch (error) {
    console.error("Unexpected error in getProductVariantsByProductId:", error);
    return [];
  }
}

/**
 * Soft delete a product variant (set deleted_at).
 */
export async function softDeleteProductVariant(
  id: string,
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { error } = await (supabase as any)
      .from("customised_products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error soft deleting product variant:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in softDeleteProductVariant:", error);
    return false;
  }
}

/**
 * Hard delete a product variant (permanently remove from database).
 */
export async function hardDeleteProductVariant(
  id: string,
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { error } = await supabase
      .from("customised_products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error hard deleting product variant:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in hardDeleteProductVariant:", error);
    return false;
  }
}
