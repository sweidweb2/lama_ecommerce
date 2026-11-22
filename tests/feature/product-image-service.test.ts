import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile } from "../helpers/mocks";

const requireAdmin = vi.fn();
const hasPrimaryImage = vi.fn();
const createProductImage = vi.fn();
const setPrimaryProductImage = vi.fn();
const getProductImageById = vi.fn();
const deleteProductImageById = vi.fn();
const getProductImagesByProductId = vi.fn();
const extractStorageObjectPath = vi.fn();
const removeFiles = vi.fn();

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/repositories/product_images.repository", () => ({
  hasPrimaryImage: (...args: unknown[]) => hasPrimaryImage(...args),
  createProductImage: (...args: unknown[]) => createProductImage(...args),
  setPrimaryProductImage: (...args: unknown[]) =>
    setPrimaryProductImage(...args),
  getProductImageById: (...args: unknown[]) => getProductImageById(...args),
  deleteProductImageById: (...args: unknown[]) =>
    deleteProductImageById(...args),
  getProductImagesByProductId: (...args: unknown[]) =>
    getProductImagesByProductId(...args),
}));

vi.mock("@/repositories/storage.repository", () => ({
  extractStorageObjectPath: (...args: unknown[]) =>
    extractStorageObjectPath(...args),
  removeFiles: (...args: unknown[]) => removeFiles(...args),
  getPublicUrl: vi.fn(),
  uploadPublicFile: vi.fn(),
}));

const productId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const imageId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

describe("product_image.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("addProductImageService rejects non-admin", async () => {
    requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    const { addProductImageService } = await import(
      "@/services/product_image.service"
    );
    await expect(
      addProductImageService(productId, "https://cdn.example/a.png"),
    ).rejects.toThrow("Unauthorized");
  });

  it("sets first image as primary", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    hasPrimaryImage.mockResolvedValue(false);
    createProductImage.mockResolvedValue({ id: imageId });
    const { addProductImageService } = await import(
      "@/services/product_image.service"
    );
    await expect(
      addProductImageService(productId, "https://cdn.example/a.png"),
    ).resolves.toBe(true);
    expect(createProductImage).toHaveBeenCalledWith({
      product_id: productId,
      url_image: "https://cdn.example/a.png",
      is_primary: true,
    });
  });

  it("does not set primary when one already exists", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    hasPrimaryImage.mockResolvedValue(true);
    createProductImage.mockResolvedValue({ id: imageId });
    const { addProductImageService } = await import(
      "@/services/product_image.service"
    );
    await expect(
      addProductImageService(productId, "https://cdn.example/b.png"),
    ).resolves.toBe(true);
    expect(createProductImage).toHaveBeenCalledWith(
      expect.objectContaining({ is_primary: false }),
    );
  });

  it("deleteProductImageService removes storage and promotes next primary", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    getProductImageById.mockResolvedValue({
      id: imageId,
      url_image: "https://cdn.example/products/a.png",
      is_primary: true,
    });
    extractStorageObjectPath.mockReturnValue("products/a.png");
    removeFiles.mockResolvedValue({ success: true });
    deleteProductImageById.mockResolvedValue(true);
    getProductImagesByProductId.mockResolvedValue([
      {
        id: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
        created_at: "2026-01-02T00:00:00.000Z",
      },
    ]);
    setPrimaryProductImage.mockResolvedValue(true);

    const { deleteProductImageService } = await import(
      "@/services/product_image.service"
    );
    await expect(
      deleteProductImageService(productId, imageId),
    ).resolves.toBe(true);
    expect(removeFiles).toHaveBeenCalledWith("products", ["products/a.png"]);
    expect(setPrimaryProductImage).toHaveBeenCalledWith(
      productId,
      "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
    );
  });
});
