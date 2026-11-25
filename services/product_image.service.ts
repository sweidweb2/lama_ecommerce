import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createProductImage,
  deleteProductImageById,
  getProductImageById,
  getProductImagesByProductId,
  hasPrimaryImage,
  setPrimaryProductImage,
  type CreateProductImageInput,
} from "@/repositories/product_images.repository";
import { getProductVariantById } from "@/repositories/product_variant.repository";
import {
  extractStorageObjectPath,
  getPublicUrl,
  removeFiles,
  uploadPublicFile,
} from "@/repositories/storage.repository";
import { assertServerActionUploadSize } from "@/lib/constants/uploads";

/**
 * Add a product image for a given product.
 * Automatically sets is_primary to true if no primary image exists, otherwise false.
 * Optional customised_product_id assigns the image to a variant of the same product.
 */
export async function addProductImageService(
  productId: string,
  urlImage: string,
  customisedProductId?: string | null,
): Promise<boolean> {
  await requireAdmin();

  const variantId: string | null = customisedProductId ?? null;
  if (variantId) {
    const variant = await getProductVariantById(variantId);
    if (!variant) {
      throw new Error("Variant not found");
    }
    if (variant.product_id !== productId) {
      throw new Error("Variant does not belong to this product");
    }
  }

  try {
    const hasPrimary = await hasPrimaryImage(productId);
    const isPrimary = !hasPrimary;

    const input: CreateProductImageInput = {
      product_id: productId,
      url_image: urlImage,
      is_primary: isPrimary,
      customised_product_id: variantId,
    };

    const created = await createProductImage(input);
    return created !== null;
  } catch (error) {
    console.error("Unexpected error in addProductImageService:", error);
    return false;
  }
}

/**
 * Upload a product image file to storage and create the DB row.
 * Returns `{ success, error }` so callers can surface the real failure.
 */
export async function uploadAndAddProductImageService(
  productId: string,
  imageFile: File,
  customisedProductId?: string | null,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  try {
    assertServerActionUploadSize(imageFile, "Image");

    if (customisedProductId) {
      const variant = await getProductVariantById(customisedProductId);
      if (!variant) {
        return { success: false, error: "Variant not found" };
      }
      if (variant.product_id !== productId) {
        return {
          success: false,
          error: "Variant does not belong to this product",
        };
      }
    }

    const name = imageFile.name || "";
    const nameExt = name.includes(".")
      ? name.split(".").pop()?.toLowerCase()
      : undefined;
    const mime =
      imageFile.type ||
      (nameExt === "jpg" || nameExt === "jpeg"
        ? "image/jpeg"
        : nameExt === "webp"
          ? "image/webp"
          : nameExt === "gif"
            ? "image/gif"
            : "image/png");
    const ext =
      nameExt && ["png", "jpg", "jpeg", "webp", "gif"].includes(nameExt)
        ? nameExt === "jpeg"
          ? "jpg"
          : nameExt
        : mime === "image/jpeg"
          ? "jpg"
          : mime.split("/")[1] || "png";
    const filePath = `products/${productId}/${crypto.randomUUID()}.${ext}`;

    const upload = await uploadPublicFile("products", filePath, imageFile, mime);
    if (!upload.success) {
      return {
        success: false,
        error: upload.error || "Storage upload failed",
      };
    }

    const publicUrl = await getPublicUrl("products", filePath);
    if (!publicUrl) {
      await removeFiles("products", [filePath]);
      return { success: false, error: "Failed to resolve public image URL" };
    }

    const hasPrimary = await hasPrimaryImage(productId);
    const created = await createProductImage({
      product_id: productId,
      url_image: publicUrl,
      is_primary: !hasPrimary,
      customised_product_id: customisedProductId ?? null,
    });
    if (!created) {
      await removeFiles("products", [filePath]);
      return {
        success: false,
        error:
          "Image uploaded but DB row insert failed (check product_images RLS / FK)",
      };
    }
    return { success: true };
  } catch (error) {
    console.error("Unexpected error in uploadAndAddProductImageService:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected upload error",
    };
  }
}

/**
 * Change which image is primary for a product.
 */
export async function changePrimaryProductImageService(
  productId: string,
  imageId: string,
): Promise<boolean> {
  await requireAdmin();
  try {
    return await setPrimaryProductImage(productId, imageId);
  } catch (error) {
    console.error("Unexpected error in changePrimaryProductImageService:", error);
    return false;
  }
}

/**
 * Delete a product image: remove storage object, delete row, promote next primary if needed.
 */
export async function deleteProductImageService(
  productId: string,
  imageId: string,
): Promise<boolean> {
  await requireAdmin();
  try {
    const image = await getProductImageById(imageId);

    if (!image) {
      return true;
    }

    const objectPath = extractStorageObjectPath(image.url_image, "products");
    if (objectPath) {
      const removed = await removeFiles("products", [objectPath]);
      if (!removed.success) {
        console.error(
          "Error deleting product image from storage:",
          removed.error,
        );
      }
    }

    const deleted = await deleteProductImageById(imageId);
    if (!deleted) {
      return false;
    }

    if (image.is_primary) {
      const remaining = await getProductImagesByProductId(productId);
      const nextImage = remaining
        .filter((img) => img.id !== imageId)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )[0];

      if (nextImage) {
        await changePrimaryProductImageService(productId, nextImage.id);
      }
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in deleteProductImageService:", error);
    return false;
  }
}
