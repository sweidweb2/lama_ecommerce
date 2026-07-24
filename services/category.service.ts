import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validators/category";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/repositories/categories.repository";
import type { Category } from "@/types/product";

// Create a new category (admin).
export async function createCategoryService(
  input: z.infer<typeof createCategorySchema>
): Promise<Category | null> {
  await requireAdmin();
  const payload = createCategorySchema.parse(input);
  return createCategory(payload);
}

// Update an existing category (admin).
export async function updateCategoryService(
  id: string,
  input: z.infer<typeof updateCategorySchema>
): Promise<Category | null> {
  await requireAdmin();
  const payload = updateCategorySchema.parse(input);
  return updateCategory(id, payload);
}

// Hard-delete a category (admin). Re-parents children; refuses if products still reference it.
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
