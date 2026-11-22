import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile } from "../helpers/mocks";

const requireAdmin = vi.fn();
const createProductVariant = vi.fn();
const updateProductVariant = vi.fn();
const hardDeleteProductVariant = vi.fn();
const getProductVariantById = vi.fn();
const getProductVariantsByProductId = vi.fn();
const getVariantOrderedQuantity = vi.fn();

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/repositories/product_variant.repository", () => ({
  createProductVariant: (...args: unknown[]) => createProductVariant(...args),
  updateProductVariant: (...args: unknown[]) => updateProductVariant(...args),
  hardDeleteProductVariant: (...args: unknown[]) =>
    hardDeleteProductVariant(...args),
  getProductVariantById: (...args: unknown[]) => getProductVariantById(...args),
  getProductVariantsByProductId: (...args: unknown[]) =>
    getProductVariantsByProductId(...args),
  getProductVariantsByProductIds: vi.fn(),
  getVariantOrderedQuantity: (...args: unknown[]) =>
    getVariantOrderedQuantity(...args),
  getVariantCartReservedQuantity: vi.fn(),
}));

const productId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const variantId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

const createInput = {
  product_id: productId,
  color: "Navy",
  size: "M",
  material: "Cotton",
  quantity_stock: 10,
};

describe("product_variant.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createProductVariantService rejects non-admin", async () => {
    requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    const { createProductVariantService } = await import(
      "@/services/product_variant.service"
    );
    await expect(createProductVariantService(createInput)).rejects.toThrow(
      "Unauthorized",
    );
    expect(createProductVariant).not.toHaveBeenCalled();
  });

  it("createProductVariantService reaches repo for admin", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    createProductVariant.mockResolvedValue({ id: variantId, ...createInput });
    const { createProductVariantService } = await import(
      "@/services/product_variant.service"
    );
    await expect(createProductVariantService(createInput)).resolves.toMatchObject({
      id: variantId,
    });
  });

  it("updateProductVariantService allows stock decrease even with order history", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    getProductVariantById.mockResolvedValue({
      id: variantId,
      quantity_stock: 10,
    });
    updateProductVariant.mockResolvedValue({
      id: variantId,
      quantity_stock: 5,
    });
    const { updateProductVariantService } = await import(
      "@/services/product_variant.service"
    );
    await expect(
      updateProductVariantService(variantId, { quantity_stock: 5 }),
    ).resolves.toMatchObject({ quantity_stock: 5 });
    expect(updateProductVariant).toHaveBeenCalledWith(variantId, {
      quantity_stock: 5,
    });
  });

  it("deleteProductVariantService refuses when order history exists", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    getVariantOrderedQuantity.mockResolvedValue(3);
    const { deleteProductVariantService } = await import(
      "@/services/product_variant.service"
    );
    await expect(deleteProductVariantService(variantId)).rejects.toThrow(
      "Cannot delete variant",
    );
    expect(hardDeleteProductVariant).not.toHaveBeenCalled();
  });

  it("deleteProductVariantService hard-deletes when no order history", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    getVariantOrderedQuantity.mockResolvedValue(0);
    hardDeleteProductVariant.mockResolvedValue(true);
    const { deleteProductVariantService } = await import(
      "@/services/product_variant.service"
    );
    await expect(deleteProductVariantService(variantId)).resolves.toBe(true);
  });
});
