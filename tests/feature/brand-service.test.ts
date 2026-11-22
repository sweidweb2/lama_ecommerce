import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile } from "../helpers/mocks";

const requireAdmin = vi.fn();
const getBrands = vi.fn();
const createBrand = vi.fn();
const updateBrand = vi.fn();
const deleteBrand = vi.fn();
const uploadPublicFile = vi.fn();
const getPublicUrl = vi.fn();
const removeFiles = vi.fn();
const extractStorageObjectPath = vi.fn();

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/repositories/brand.repository", () => ({
  getBrands: (...args: unknown[]) => getBrands(...args),
  createBrand: (...args: unknown[]) => createBrand(...args),
  updateBrand: (...args: unknown[]) => updateBrand(...args),
  deleteBrand: (...args: unknown[]) => deleteBrand(...args),
}));

vi.mock("@/repositories/storage.repository", () => ({
  uploadPublicFile: (...args: unknown[]) => uploadPublicFile(...args),
  getPublicUrl: (...args: unknown[]) => getPublicUrl(...args),
  removeFiles: (...args: unknown[]) => removeFiles(...args),
  extractStorageObjectPath: (...args: unknown[]) =>
    extractStorageObjectPath(...args),
}));

describe("brand.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getBrandsService returns brands without admin gate", async () => {
    getBrands.mockResolvedValue([{ id: "b1", name: "Lama" }]);
    const { getBrandsService } = await import("@/services/brand.service");
    await expect(getBrandsService()).resolves.toEqual([
      { id: "b1", name: "Lama" },
    ]);
    expect(requireAdmin).not.toHaveBeenCalled();
  });

  it("create/update/delete reject non-admin", async () => {
    requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    const {
      createBrandService,
      updateBrandService,
      deleteBrandService,
    } = await import("@/services/brand.service");

    await expect(
      createBrandService({ name: "Lama", slug: "lama" }),
    ).rejects.toThrow("Unauthorized");
    await expect(
      updateBrandService({ id: "b1", name: "Lama", slug: "lama" }),
    ).rejects.toThrow("Unauthorized");
    await expect(deleteBrandService("b1")).rejects.toThrow("Unauthorized");
    expect(createBrand).not.toHaveBeenCalled();
  });

  it("createBrandService reaches repo for admin", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    createBrand.mockResolvedValue({ id: "b1", name: "Lama", slug: "lama" });
    const { createBrandService } = await import("@/services/brand.service");
    await expect(
      createBrandService({ name: "Lama", slug: "lama" }),
    ).resolves.toMatchObject({ id: "b1" });
    expect(createBrand).toHaveBeenCalledWith({
      name: "Lama",
      slug: "lama",
      logo_image_url: null,
    });
  });

  it("deleteBrandService removes logo after successful delete", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    deleteBrand.mockResolvedValue(true);
    extractStorageObjectPath.mockReturnValue("brands/logo.png");
    removeFiles.mockResolvedValue({ success: true });
    const { deleteBrandService } = await import("@/services/brand.service");
    await expect(
      deleteBrandService("b1", "https://cdn.example/brands/logo.png"),
    ).resolves.toBe(true);
    expect(removeFiles).toHaveBeenCalledWith("brands", ["brands/logo.png"]);
  });
});
