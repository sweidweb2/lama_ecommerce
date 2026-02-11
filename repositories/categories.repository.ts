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
export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
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
    .insert([{
      name: input.name,
      slug: input.slug ?? null,
      parent_id: input.parent_id ?? null,
      is_active: input.is_active ?? true,
    }] as any)
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
    .update([patch] as never)
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
 * Also re-parent its children:
 * - If the deleted category has a parent, children are moved to that parent.
 * - If the deleted category is a root category, children become root (parent_id = null).
 */
export async function deleteCategory(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerActionClient();

  // Fetch parent_id of the category being deleted
  const { data: category, error: fetchError } = await supabase
    .from("categories")
    .select("parent_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching category before delete:", fetchError);
    return false;
  }

  const parentId =
    (category as { parent_id: string | null } | null)?.parent_id ?? null;

  // Re-parent children: move them to the deleted category's parent (or root)
  const { error: childrenError } = await supabase
    .from("categories")
    .update([{ parent_id: parentId }] as never)
    .eq("parent_id", id);

  if (childrenError) {
    console.error("Error re-parenting child categories:", childrenError);
    return false;
  }

  // Soft-delete the category itself
  const { error: deleteError } = await supabase
    .from("categories")
    .update([{ deleted_at: new Date().toISOString(), is_active: false }] as never)
    .eq("id", id);

  if (deleteError) {
    console.error("Error deleting category:", deleteError);
    return false;
  }

  return true;
}
