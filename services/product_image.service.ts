import {
  createProductImage,
  hasPrimaryImage,
  setPrimaryProductImage,
  type CreateProductImageInput,
} from "@/repositories/product_images.repository";

/**
 * Add a product image for a given product.
 * Automatically sets is_primary to true if no primary image exists, otherwise false.
 */
export async function addProductImageService(
  productId: string,
  urlImage: string,
): Promise<boolean> {
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
 * Change which image is primary for a product.
 */
export async function changePrimaryProductImageService(
  productId: string,
  imageId: string,
): Promise<boolean> {
  try {
    return await setPrimaryProductImage(productId, imageId);
  } catch (error) {
    console.error("Unexpected error in changePrimaryProductImageService:", error);
    return false;
  }
}
