import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile } from "../helpers/mocks";

const requireAdmin = vi.fn();
const createProduct = vi.fn();
const updateProduct = vi.fn();
const getAdminProducts = vi.fn();
const getAdminProductsPage = vi.fn();
const getAdminProductCatalogStats = vi.fn();
const getAdminProductStockFlags = vi.fn();
const getProductById = vi.fn();
const hardDeleteProduct = vi.fn();
const getProductsRepo = vi.fn();
const getCategoryIdBySlug = vi.fn();
const getBrandIdBySlug = vi.fn();
const getProductBySlug = vi.fn();
const getRelatedProducts = vi.fn();
const getProductVariantFacets = vi.fn();
const getProductPriceBounds = vi.fn();

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/repositories/product.repository", () => ({
  createProduct: (...args: unknown[]) => createProduct(...args),
  updateProduct: (...args: unknown[]) => updateProduct(...args),
  getAdminProducts: (...args: unknown[]) => getAdminProducts(...args),
  getAdminProductsPage: (...args: unknown[]) => getAdminProductsPage(...args),
  getAdminProductCatalogStats: (...args: unknown[]) =>
    getAdminProductCatalogStats(...args),
  getAdminProductStockFlags: (...args: unknown[]) =>
    getAdminProductStockFlags(...args),
  getProductById: (...args: unknown[]) => getProductById(...args),
  hardDeleteProduct: (...args: unknown[]) => hardDeleteProduct(...args),
  getProducts: (...args: unknown[]) => getProductsRepo(...args),
  getProductBySlug: (...args: unknown[]) => getProductBySlug(...args),
  getRelatedProducts: (...args: unknown[]) => getRelatedProducts(...args),
  getProductVariantFacets: (...args: unknown[]) =>
    getProductVariantFacets(...args),
  getProductPriceBounds: (...args: unknown[]) => getProductPriceBounds(...args),
}));

vi.mock("@/repositories/categories.repository", () => ({
  getCategoryIdBySlug: (...args: unknown[]) => getCategoryIdBySlug(...args),
}));

vi.mock("@/repositories/brand.repository", () => ({
  getBrandIdBySlug: (...args: unknown[]) => getBrandIdBySlug(...args),
}));

const productInput = {
  name: "Linen Shirt",
  slug: "linen-shirt",
  price: 29.99,
  is_featured: false,
  is_trending: false,
  is_active: true,
};

describe("product.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createProductService rejects non-admin", async () => {
    requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    const { createProductService } = await import("@/services/product.service");
    await expect(
      createProductService(productInput, "owner-1"),
    ).rejects.toThrow("Unauthorized");
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("createProductService reaches repo for admin", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    createProduct.mockResolvedValue({ id: "p1", ...productInput });
    const { createProductService } = await import("@/services/product.service");
    await expect(
      createProductService(productInput, "owner-1"),
    ).resolves.toMatchObject({ id: "p1" });
    expect(createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Linen Shirt",
        slug: "linen-shirt",
        price: 29.99,
        owner_id: "owner-1",
      }),
    );
  });

  it("admin list helpers return empty on Unauthorized", async () => {
    requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    const {
      getAdminProductsService,
      getAdminProductsPageService,
      getAdminProductCatalogStatsService,
      getAdminProductStockFlagsService,
      getAdminProductByIdService,
      deleteProductService,
    } = await import("@/services/product.service");

    await expect(getAdminProductsService()).resolves.toEqual([]);
    await expect(getAdminProductsPageService()).resolves.toEqual({
      products: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
    });
    await expect(getAdminProductCatalogStatsService()).resolves.toEqual({
      total: 0,
      active: 0,
      featured: 0,
      trending: 0,
    });
    await expect(getAdminProductStockFlagsService(["p1"])).resolves.toEqual({});
    await expect(getAdminProductByIdService("p1")).resolves.toBeNull();
    await expect(deleteProductService("p1")).resolves.toBe(false);
    expect(getAdminProducts).not.toHaveBeenCalled();
    expect(hardDeleteProduct).not.toHaveBeenCalled();
  });

  it("getProducts returns empty when category slug unknown", async () => {
    getCategoryIdBySlug.mockResolvedValue(null);
    const { getProducts } = await import("@/services/product.service");
    await expect(getProducts({ categorySlug: "missing" })).resolves.toEqual({
      data: [],
      count: 0,
    });
    expect(getProductsRepo).not.toHaveBeenCalled();
  });

  it("getProducts resolves brand/category ids then hits repo", async () => {
    getCategoryIdBySlug.mockResolvedValue("cat-1");
    getBrandIdBySlug.mockResolvedValue("brand-1");
    getProductsRepo.mockResolvedValue({ data: [{ id: "p1" }], count: 1 });
    const { getProducts } = await import("@/services/product.service");
    await expect(
      getProducts({ categorySlug: "shirts", brandSlug: "lama" }),
    ).resolves.toEqual({ data: [{ id: "p1" }], count: 1 });
    expect(getProductsRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: "cat-1",
        brandId: "brand-1",
      }),
    );
  });

  it("public detail helpers pass through to repo", async () => {
    getProductBySlug.mockResolvedValue({ id: "p1", slug: "linen-shirt" });
    getRelatedProducts.mockResolvedValue([]);
    getProductVariantFacets.mockResolvedValue({ colors: [], sizes: [] });
    getProductPriceBounds.mockResolvedValue({ minPrice: 10, maxPrice: 100 });
    const {
      getProductBySlugService,
      getRelatedProductsService,
      getProductVariantFacetsService,
      getProductPriceBoundsService,
    } = await import("@/services/product.service");

    await expect(getProductBySlugService("linen-shirt")).resolves.toMatchObject({
      id: "p1",
    });
    await expect(
      getRelatedProductsService({
        id: "p1",
        brand_id: null,
        category_id: null,
      }),
    ).resolves.toEqual([]);
    await expect(getProductVariantFacetsService()).resolves.toEqual({
      colors: [],
      sizes: [],
    });
    await expect(getProductPriceBoundsService()).resolves.toEqual({
      minPrice: 10,
      maxPrice: 100,
    });
  });
});
