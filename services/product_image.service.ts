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
import {
  extractStorageObjectPath,
  getPublicUrl,
  removeFiles,
  uploadPublicFile,
} from "@/repositories/storage.repository";

/**
 * Add a product image for a given product.
 * Automatically sets is_primary to true if no primary image exists, otherwise false.
 */
export async function addProductImageService(
  productId: string,
  urlImage: string,
): Promise<boolean> {
  await requireAdmin();
  try {
    // Check if product already has a primary image
    const hasPrimary = await hasPrimaryImage(productId);

    // Set is_primary to true only if no primary image exists
    const isPrimary = !hasPrimary;

    const input: CreateProductImageInput = {
      product_id: productId,
      url_image: urlImage,
      is_primary: isPrimary,
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
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  try {
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
      return { success: false, error: "Failed to resolve public image URL" };
    }

    const created = await addProductImageService(productId, publicUrl);
    if (!created) {
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
      // Already deleted
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
        // Continue with DB deletion even if storage delete fails
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
