import {
  createSupabaseServerActionClient,
  createSupabaseServerComponentClient,
} from "@/lib/supabase/server";
import type { Brand } from "@/types/product";

export async function getBrands(): Promise<Brand[]> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching brands:", error);
      return [];
    }

    return (data ?? []) as Brand[];
  } catch (error) {
    console.error("Unexpected error in getBrands:", error);
    return [];
  }
}

/**
 * Fetch a brand id by slug (for filtering products).
 */
export async function getBrandIdBySlug(slug: string): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return (data as { id: string }).id;
  } catch {
    return null;
  }
}

export interface CreateBrandInput {
  name: string;
  slug: string | null;
  logo_image_url: string | null;
}

export interface UpdateBrandInput {
  id: string;
  name: string;
  slug: string | null;
  logo_image_url: string | null;
}

export async function createBrand(
  input: CreateBrandInput,
): Promise<Brand | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { data, error } = await supabase
      .from("brands")
      .insert([
        {
          name: input.name,
          slug: input.slug ?? undefined,
          logo_image_url: input.logo_image_url ?? undefined,
        },
      ] as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating brand:", error);
      return null;
    }

    return (data ?? null) as Brand | null;
  } catch (error) {
    console.error("Unexpected error in createBrand:", error);
    return null;
  }
}

export async function updateBrand(
  input: UpdateBrandInput,
): Promise<Brand | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { data, error } = await (supabase as any)
      .from("brands")
      .update({
        name: input.name,
        slug: input.slug ?? undefined,
        logo_image_url: input.logo_image_url ?? undefined,
      })
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating brand:", error);
      return null;
    }

    return (data ?? null) as Brand | null;
  } catch (error) {
    console.error("Unexpected error in updateBrand:", error);
    return null;
  }
}

/**
 * Hard-delete a brand.
 * Blocks when products still reference this brand.
 */
export async function deleteBrand(id: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();

    const { count: productCount, error: productError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", id);

    if (productError) {
      console.error("Error checking products before brand delete:", productError);
      return false;
    }
    if ((productCount ?? 0) > 0) {
      throw new Error(
        "Cannot delete brand: products still reference it. Reassign them first.",
      );
    }

    const { error } = await supabase.from("brands").delete().eq("id", id);

    if (error) {
      if (error.code === "23503") {
        throw new Error(
          "Cannot delete brand: related records still exist. Remove them first.",
        );
      }
      console.error("Error deleting brand:", error);
      return false;
    }

    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Cannot delete brand:")
    ) {
      throw error;
    }
    console.error("Unexpected error in deleteBrand:", error);
    return false;
  }
}