import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProductImage } from "@/types/product";

export interface CreateProductImageInput {
  product_id: string;
  url_image: string;
  is_primary?: boolean;
  customised_product_id?: string | null;
}

/**
 * Insert a product image row for a given product.
 */
export async function createProductImage(
  input: CreateProductImageInput,
): Promise<ProductImage | null> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { data, error } = await supabase
      .from("product_images")
      .insert([
        {
          product_id: input.product_id,
          url_image: input.url_image,
          is_primary: input.is_primary ?? false,
          customised_product_id: input.customised_product_id ?? null,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Error creating product image:", error);
      return null;
    }

    return (data ?? null) as ProductImage | null;
  } catch (error) {
    console.error("Unexpected error in createProductImage:", error);
    return null;
  }
}

/**
 * Get a single product image by id.
 */
export async function getProductImageById(
  imageId: string,
): Promise<ProductImage | null> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { data, error } = await supabase
      .from("product_images")
      .select("*")
      .eq("id", imageId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching product image by id:", error);
      return null;
    }

    return (data ?? null) as ProductImage | null;
  } catch (error) {
    console.error("Unexpected error in getProductImageById:", error);
    return null;
  }
}

/**
 * Delete a product image row by id (table only).
 */
export async function deleteProductImageById(
  imageId: string,
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { error } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId);

    if (error) {
      console.error("Error deleting product image row:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in deleteProductImageById:", error);
    return false;
  }
}

/**
 * Get product images for a given product (for cleanup / display).
 */
export async function getProductImagesByProductId(
  productId: string,
): Promise<ProductImage[]> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { data, error } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId);

    if (error) {
      console.error("Error fetching product images:", error);
      return [];
    }

    return (data ?? []) as ProductImage[];
  } catch (error) {
    console.error("Unexpected error in getProductImagesByProductId:", error);
    return [];
  }
}

/**
 * Get product images assigned to a specific variant.
 */
export async function getProductImagesByVariantId(
  variantId: string,
): Promise<ProductImage[]> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { data, error } = await supabase
      .from("product_images")
      .select("*")
      .eq("customised_product_id", variantId);

    if (error) {
      console.error("Error fetching product images by variant:", error);
      return [];
    }

    return (data ?? []) as ProductImage[];
  } catch (error) {
    console.error("Unexpected error in getProductImagesByVariantId:", error);
    return [];
  }
}

/**
 * Check if a product has a primary image.
 */
export async function hasPrimaryImage(
  productId: string,
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { data, error } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .eq("is_primary", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error checking for primary image:", error);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error("Unexpected error in hasPrimaryImage:", error);
    return false;
  }
}

/**
 * Set a specific image as primary for a product (atomic RPC).
 */
export async function setPrimaryProductImage(
  productId: string,
  imageId: string,
): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.rpc("set_primary_product_image", {
      p_product_id: productId,
      p_image_id: imageId,
    });

    if (error) {
      console.error("Error in set_primary_product_image RPC:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in setPrimaryProductImage:", error);
    return false;
  }
}
