import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validators/category";
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  getCategories,
  getCategoryProductCounts,
  getHomeCategories,
  updateCategory,
  type HomeCategory,
} from "@/repositories/categories.repository";
import type { Category } from "@/types/product";

/** Get all active categories for filtering/display (storefront). */
export async function getCategoriesService(): Promise<Category[]> {
  return getCategories();
}

/** Get all categories including inactive (admin list + product selects). */
export async function getAdminCategoriesService(): Promise<Category[]> {
  return getAdminCategories();
}

/** Product counts per category for admin categories table. */
export async function getCategoryProductCountsService(
  categoryIds: string[],
): Promise<Record<string, number>> {
  try {
    await requireAdmin();
  } catch {
    return {};
  }
  return getCategoryProductCounts(categoryIds);
}

/** Home showcase: active categories with product counts and cover images. */
export async function getHomeCategoriesService(): Promise<HomeCategory[]> {
  return getHomeCategories();
}

export type { HomeCategory };

/** Create a new category (admin). */
export async function createCategoryService(
  input: z.infer<typeof createCategorySchema>,
): Promise<Category | null> {
  await requireAdmin();
  const payload = createCategorySchema.parse(input);
  return createCategory(payload);
}

/** Update an existing category (admin). */
export async function updateCategoryService(
  id: string,
  input: z.infer<typeof updateCategorySchema>,
): Promise<Category | null> {
  await requireAdmin();
  const payload = updateCategorySchema.parse(input);
  return updateCategory(id, payload);
}

/** Hard-delete a category (admin). Re-parents children; refuses if products still reference it. */
export async function deleteCategoryService(id: string): Promise<boolean> {
  await requireAdmin();
  try {
    return await deleteCategory(id);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Cannot delete category:")
    ) {
      throw error;
    }
    console.error("Unexpected error in deleteCategoryService:", error);
    return false;
  }
}
