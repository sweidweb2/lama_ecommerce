import { z } from "zod";
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
  const payload = createCategorySchema.parse(input);
  return createCategory(payload);
}

// Update an existing category (admin).
export async function updateCategoryService(
  id: string,
  input: z.infer<typeof updateCategorySchema>
): Promise<Category | null> {
  const payload = updateCategorySchema.parse(input);
  return updateCategory(id, payload);
}

// Soft-delete a category (admin).
export async function deleteCategoryService(id: string): Promise<boolean> {
  return deleteCategory(id);
}

