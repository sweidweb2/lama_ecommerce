import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getCategories,
  getAdminCategories,
  getCategoryProductCounts,
  getHomeCategories,
  type HomeCategory,
} from "@/repositories/categories.repository";
import type { Category } from "@/types/product";

/**
 * Get all active categories for filtering/display (storefront).
 */
export async function getCategoriesService(): Promise<Category[]> {
  return getCategories();
}

/**
 * Get all categories including inactive (admin list + product selects).
 */
export async function getAdminCategoriesService(): Promise<Category[]> {
  return getAdminCategories();
}

/**
 * Product counts per category for admin categories table.
 */
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

/**
 * Home showcase: active categories with product counts and cover images.
 */
export async function getHomeCategoriesService(): Promise<HomeCategory[]> {
  return getHomeCategories();
}

export type { HomeCategory };
