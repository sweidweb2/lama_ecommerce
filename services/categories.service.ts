import {
  getCategories,
  getHomeCategories,
  type HomeCategory,
} from "@/repositories/categories.repository";
import type { Category } from "@/types/product";

/**
 * Get all active categories for filtering/display.
 */
export async function getCategoriesService(): Promise<Category[]> {
  return getCategories();
}

/**
 * Home showcase: active categories with product counts and cover images.
 */
export async function getHomeCategoriesService(): Promise<HomeCategory[]> {
  return getHomeCategories();
}

export type { HomeCategory };
