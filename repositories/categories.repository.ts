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
      .eq("is_active", true)
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
 * Hard-delete a category (admin).
 * Re-parents children first:
 * - If the deleted category has a parent, children move to that parent.
 * - If it is a root category, children become root (parent_id = null).
 * Blocks when products still reference this category.
 */
export async function deleteCategory(id: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerActionClient();

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

    const { error: childrenError } = await supabase
      .from("categories")
      .update([{ parent_id: parentId }] as never)
      .eq("parent_id", id);

    if (childrenError) {
      console.error("Error re-parenting child categories:", childrenError);
      return false;
    }

    const { count: productCount, error: productError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", id);

    if (productError) {
      console.error("Error checking products before category delete:", productError);
      return false;
    }
    if ((productCount ?? 0) > 0) {
      throw new Error(
        "Cannot delete category: products still reference it. Reassign them first.",
      );
    }

    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (deleteError) {
      if (deleteError.code === "23503") {
        throw new Error(
          "Cannot delete category: related records still exist. Remove them first.",
        );
      }
      console.error("Error deleting category:", deleteError);
      return false;
    }

    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Cannot delete category:")
    ) {
      throw error;
    }
    console.error("Unexpected error in deleteCategory:", error);
    return false;
  }
}
