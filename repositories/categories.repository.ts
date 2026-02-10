import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import type { Category } from "@/types/product";

/**
 * Fetch all active categories, ordered by name.
 */
export async function getActiveCategories(): Promise<Category[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }

    return (data ?? []) as Category[];
  } catch (error) {
    console.error("Unexpected error in getActiveCategories:", error);
    return [];
  }
}

/**
 * Fetch a category id by slug (for filtering products).
 */
export async function getCategoryIdBySlug(slug: string): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return (data as { id: string }).id;
  } catch {
    return null;
  }
}
