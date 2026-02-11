import { getCategories } from "@/repositories/categories.repository";
import type { Category } from "@/types/product";

/**
 * Get all active categories for filtering/display.
 */
export async function getCategoriesService(): Promise<Category[]> {
  return getCategories();
}
