import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { ProductImage } from "@/types/product";

export interface CreateProductImageInput {
  product_id: string;
  url_image: string;
  is_primary?: boolean;
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
        },
      ] as any)
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

