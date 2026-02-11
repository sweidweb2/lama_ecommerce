import {
  createSupabaseServerActionClient,
  createSupabaseServerComponentClient,
} from "@/lib/supabase/server";
import type { Category } from "@/types/product";
import type {
  CategoryBaseInput,
  UpdateCategoryInput,
} from "@/lib/validators/category";

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

/**
 * Create a new category (admin).
 */
export async function createCategory(
  input: CategoryBaseInput
): Promise<Category | null> {
  const supabase = await createSupabaseServerActionClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: input.name,
      slug: input.slug ?? null,
      parent_id: input.parent_id ?? null,
      is_active: input.is_active ?? true,
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    console.error("Error creating category:", error);
    return null;
  }

  return data as Category;
}

/**
 * Update an existing category (admin).
 */
export async function updateCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<Category | null> {
  const supabase = await createSupabaseServerActionClient();

  const patch: Partial<Category> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.parent_id !== undefined) patch.parent_id = input.parent_id;
  if (input.is_active !== undefined) patch.is_active = input.is_active;

  const { data, error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    console.error("Error updating category:", error);
    return null;
  }

  return data as Category;
}

/**
 * Soft-delete a category (admin).
 */
export async function deleteCategory(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerActionClient();

  const { error } = await supabase
    .from("categories")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Error deleting category:", error);
    return false;
  }

  return true;
}
