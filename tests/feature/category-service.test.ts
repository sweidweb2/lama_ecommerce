import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile } from "../helpers/mocks";

const requireAdmin = vi.fn();
const createCategory = vi.fn();
const updateCategory = vi.fn();
const deleteCategory = vi.fn();
const getCategories = vi.fn();
const getAdminCategories = vi.fn();
const getCategoryProductCounts = vi.fn();
const getHomeCategories = vi.fn();

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/repositories/categories.repository", () => ({
  createCategory: (...args: unknown[]) => createCategory(...args),
  updateCategory: (...args: unknown[]) => updateCategory(...args),
  deleteCategory: (...args: unknown[]) => deleteCategory(...args),
  getCategories: (...args: unknown[]) => getCategories(...args),
  getAdminCategories: (...args: unknown[]) => getAdminCategories(...args),
  getCategoryProductCounts: (...args: unknown[]) =>
    getCategoryProductCounts(...args),
  getHomeCategories: (...args: unknown[]) => getHomeCategories(...args),
}));

describe("category.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mutations reject non-admin", async () => {
    requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    const {
      createCategoryService,
      updateCategoryService,
      deleteCategoryService,
    } = await import("@/services/category.service");

    await expect(
      createCategoryService({ name: "Shirts", slug: "shirts" }),
    ).rejects.toThrow("Unauthorized");
    await expect(
      updateCategoryService("c1", { name: "Shirts", slug: "shirts" }),
    ).rejects.toThrow("Unauthorized");
    await expect(deleteCategoryService("c1")).rejects.toThrow("Unauthorized");
    expect(createCategory).not.toHaveBeenCalled();
  });

  it("createCategoryService reaches repo for admin", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    createCategory.mockResolvedValue({ id: "c1", name: "Shirts", slug: "shirts" });
    const { createCategoryService } = await import("@/services/category.service");
    await expect(
      createCategoryService({ name: "Shirts", slug: "shirts" }),
    ).resolves.toMatchObject({ id: "c1" });
  });

  it("deleteCategoryService rethrows product-reference errors", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    deleteCategory.mockRejectedValue(
      new Error("Cannot delete category: products still reference it"),
    );
    const { deleteCategoryService } = await import("@/services/category.service");
    await expect(deleteCategoryService("c1")).rejects.toThrow(
      "Cannot delete category:",
    );
  });

  it("storefront category reads have no admin gate", async () => {
    getCategories.mockResolvedValue([{ id: "c1" }]);
    getHomeCategories.mockResolvedValue([{ id: "c1", productCount: 2 }]);
    const {
      getCategoriesService,
      getHomeCategoriesService,
    } = await import("@/services/category.service");
    await expect(getCategoriesService()).resolves.toEqual([{ id: "c1" }]);
    await expect(getHomeCategoriesService()).resolves.toEqual([
      { id: "c1", productCount: 2 },
    ]);
    expect(requireAdmin).not.toHaveBeenCalled();
  });

  it("getCategoryProductCountsService returns {} for non-admin", async () => {
    requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    const { getCategoryProductCountsService } = await import(
      "@/services/category.service"
    );
    await expect(getCategoryProductCountsService(["c1"])).resolves.toEqual({});
    expect(getCategoryProductCounts).not.toHaveBeenCalled();
  });

  it("getCategoryProductCountsService reaches repo for admin", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    getCategoryProductCounts.mockResolvedValue({ c1: 3 });
    const { getCategoryProductCountsService } = await import(
      "@/services/category.service"
    );
    await expect(getCategoryProductCountsService(["c1"])).resolves.toEqual({
      c1: 3,
    });
  });
});
