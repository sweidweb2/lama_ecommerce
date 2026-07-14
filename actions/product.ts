"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUserProfile } from "@/services/profile.service";
import { ROLES } from "@/lib/constants/roles";
import {
  createProductService,
  updateProductService,
  deleteProductService,
} from "@/services/product.service";
import { createProductSchema } from "@/lib/validators/product/create";
import { updateProductSchema } from "@/lib/validators/product/update";
import {
  uploadAndAddProductImageService,
  changePrimaryProductImageService,
  deleteProductImageService,
} from "@/services/product_image.service";
import { addProductImageSchema } from "@/lib/validators/product_image/create";
import {
  createProductVariantService,
  updateProductVariantService,
  deleteProductVariantService,
  getProductVariantsByProductIdService,
} from "@/services/product_variant.service";
import { getAdminProductsService } from "@/services/product.service";
import { createProductVariantSchema } from "@/lib/validators/product_variant/create";
import { updateProductVariantSchema } from "@/lib/validators/product_variant/update";
import type { ProductWithRelations } from "@/types/product";
import type { ProductVariant } from "@/types/product";

const idSchema = z.string().uuid();

export async function createProductAction(formData: FormData): Promise<void> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    const raw = {
      name: formData.get("name"),
      description: formData.get("description"),
      slug: formData.get("slug"),
      brand_id: formData.get("brand_id"),
      category_id: formData.get("category_id"),
      sku: formData.get("sku"),
      price: formData.get("price"),
      is_featured: formData.get("is_featured"),
      is_trending: formData.get("is_trending"),
      is_active: formData.get("is_active"),
    };

    const parsed = createProductSchema.parse({
      name: raw.name?.toString().trim(),
      description: raw.description
        ? raw.description.toString().trim() || null
        : null,
      slug: raw.slug ? raw.slug.toString().trim() || null : null,
      brand_id: raw.brand_id
        ? raw.brand_id.toString().trim() || null
        : null,
      category_id: raw.category_id
        ? raw.category_id.toString().trim() || null
        : null,
      sku: raw.sku ? raw.sku.toString().trim() || null : null,
      price: raw.price ? Number(raw.price.toString()) : NaN,
      is_featured:
        raw.is_featured !== null && raw.is_featured !== undefined
          ? raw.is_featured === "on" || raw.is_featured === "true"
          : undefined,
      is_trending:
        raw.is_trending !== null && raw.is_trending !== undefined
          ? raw.is_trending === "on" || raw.is_trending === "true"
          : undefined,
      is_active:
        raw.is_active !== null && raw.is_active !== undefined
          ? raw.is_active === "on" || raw.is_active === "true"
          : undefined,
    });

    const created = await createProductService(parsed, profile.user_id);
    if (!created) {
      throw new Error("Failed to create product");
    }

    const imageFile = formData.get("images");

    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      const uploaded = await uploadAndAddProductImageService(
        created.id,
        imageFile,
      );
      if (!uploaded.success) {
        console.error("Error uploading product image on create:", uploaded.error);
        // Do not fail the whole product creation if image upload fails
      }
    }

    revalidatePath("/admin/products");
  } catch (error) {
    console.error("Unexpected error in createProductAction:", error);
    throw error;
  }
}

export async function updateProductAction(formData: FormData): Promise<void> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    const idRaw = formData.get("id")?.toString();
    const id = idSchema.parse(idRaw);

    const raw = {
      name: formData.get("name"),
      description: formData.get("description"),
      slug: formData.get("slug"),
      brand_id: formData.get("brand_id"),
      category_id: formData.get("category_id"),
      sku: formData.get("sku"),
      price: formData.get("price"),
      is_featured: formData.get("is_featured"),
      is_trending: formData.get("is_trending"),
      is_active: formData.get("is_active"),
    };

    const parsed = updateProductSchema.parse({
      name: raw.name ? raw.name.toString().trim() : undefined,
      description:
        raw.description === null || raw.description === undefined
          ? undefined
          : raw.description.toString().trim() || null,
      slug:
        raw.slug === null || raw.slug === undefined
          ? undefined
          : raw.slug.toString().trim() || null,
      brand_id:
        raw.brand_id === null || raw.brand_id === undefined
          ? undefined
          : raw.brand_id.toString().trim() || null,
      category_id:
        raw.category_id === null || raw.category_id === undefined
          ? undefined
          : raw.category_id.toString().trim() || null,
      sku:
        raw.sku === null || raw.sku === undefined
          ? undefined
          : raw.sku.toString().trim() || null,
      price:
        raw.price === null || raw.price === undefined
          ? undefined
          : Number(raw.price.toString()),
      is_featured:
        raw.is_featured !== null && raw.is_featured !== undefined
          ? raw.is_featured === "on" || raw.is_featured === "true"
          : undefined,
      is_trending:
        raw.is_trending !== null && raw.is_trending !== undefined
          ? raw.is_trending === "on" || raw.is_trending === "true"
          : undefined,
      is_active:
        raw.is_active !== null && raw.is_active !== undefined
          ? raw.is_active === "on" || raw.is_active === "true"
          : undefined,
    });

    const updated = await updateProductService(id, parsed);
    if (!updated) {
      throw new Error("Failed to update product");
    }

    // Revalidate the products list and the details page (route uses product ID).
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
  } catch (error) {
    console.error("Unexpected error in updateProductAction:", error);
    throw error;
  }
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    const idRaw = formData.get("id")?.toString();
    const id = idSchema.parse(idRaw);

    const ok = await deleteProductService(id);
    if (!ok) {
      throw new Error("Failed to delete product");
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/products/grid");
  } catch (error) {
    console.error("Unexpected error in deleteProductAction:", error);
    throw error;
  }
}

export async function addProductImageAction(formData: FormData): Promise<void> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    const productIdRaw = formData.get("product_id")?.toString();
    const imageFile = formData.get("image");

    if (!productIdRaw) {
      throw new Error("Product ID is required");
    }

    if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
      throw new Error("Image file is required");
    }

    // Validate product_id
    const parsed = addProductImageSchema.parse({ product_id: productIdRaw });
    const productId = parsed.product_id;

    const result = await uploadAndAddProductImageService(productId, imageFile);
    if (!result.success) {
      throw new Error(
        result.error
          ? `Failed to upload or create product image: ${result.error}`
          : "Failed to upload or create product image",
      );
    }

    // Revalidate the products list and the specific product details page
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
  } catch (error) {
    console.error("Unexpected error in addProductImageAction:", error);
    throw error;
  }
}

export async function changePrimaryProductImageAction(
  formData: FormData,
): Promise<void> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    const productIdRaw = formData.get("product_id")?.toString();
    const imageIdRaw = formData.get("image_id")?.toString();

    if (!productIdRaw || !imageIdRaw) {
      throw new Error("Product ID and image ID are required");
    }

    // For image deletion we trust the incoming IDs from the UI and skip UUID validation,
    // since productId may in some cases come from non-UUID routes.
    const productId = productIdRaw;
    const imageId = imageIdRaw;

    const success = await changePrimaryProductImageService(productId, imageId);
    if (!success) {
      throw new Error("Failed to change primary product image");
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
  } catch (error) {
    console.error("Unexpected error in changePrimaryProductImageAction:", error);
    throw error;
  }
}

export async function deleteProductImageAction(
  formData: FormData,
): Promise<void> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    const productIdRaw = formData.get("product_id")?.toString();
    const imageIdRaw = formData.get("image_id")?.toString();

    if (!productIdRaw || !imageIdRaw) {
      throw new Error("Product ID and image ID are required");
    }

    // For deleting images we don't strictly require UUID validation – just use raw strings.
    const productId = productIdRaw;
    const imageId = imageIdRaw;

    const success = await deleteProductImageService(productId, imageId);
    if (!success) {
      throw new Error("Failed to delete product image");
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
  } catch (error) {
    console.error("Unexpected error in deleteProductImageAction:", error);
    throw error;
  }
}

export async function createProductVariantAction(
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    const raw = {
      product_id: formData.get("product_id")?.toString(),
      color: formData.get("color")?.toString(),
      size: formData.get("size")?.toString(),
      material: formData.get("material")?.toString(),
      quantity_stock: formData.get("quantity_stock")?.toString(),
      sku_variant: formData.get("sku_variant")?.toString(),
      price_override: formData.get("price_override")?.toString(),
    };

    const parsed = createProductVariantSchema.safeParse({
      product_id: raw.product_id,
      color: raw.color ? raw.color.trim() || null : null,
      size: raw.size ? raw.size.trim() || null : null,
      material: raw.material ? raw.material.trim() || null : null,
      quantity_stock: raw.quantity_stock ? Number(raw.quantity_stock) : 0,
      sku_variant: raw.sku_variant ? raw.sku_variant.trim() || null : null,
      price_override: raw.price_override
        ? Number(raw.price_override)
        : null,
    });

    if (!parsed.success) {
      const first =
        parsed.error.issues[0]?.message ?? "Invalid variant data";
      return { success: false, error: first };
    }

    const created = await createProductVariantService(parsed.data);
    if (!created) {
      return { success: false, error: "Failed to create product variant" };
    }

    revalidatePath("/admin/products", "layout");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error in createProductVariantAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create product variant",
    };
  }
}

export async function updateProductVariantAction(
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    const variantIdRaw = formData.get("variant_id")?.toString();
    if (!variantIdRaw) {
      return { success: false, error: "Variant ID is required" };
    }

    const variantIdParsed = idSchema.safeParse(variantIdRaw);
    if (!variantIdParsed.success) {
      return { success: false, error: "Invalid variant ID" };
    }

    const raw = {
      product_id: formData.get("product_id")?.toString(),
      color: formData.get("color")?.toString(),
      size: formData.get("size")?.toString(),
      material: formData.get("material")?.toString(),
      quantity_stock: formData.get("quantity_stock")?.toString(),
      sku_variant: formData.get("sku_variant")?.toString(),
      price_override: formData.get("price_override")?.toString(),
    };

    const hasQuantityStock = formData.has("quantity_stock");
    const hasPriceOverride = formData.has("price_override");

    const updateData: {
      product_id?: string;
      color: string | null;
      size: string | null;
      material: string | null;
      quantity_stock?: number;
      sku_variant: string | null;
      price_override?: number | null;
    } = {
      product_id: raw.product_id,
      color: raw.color ? raw.color.trim() || null : null,
      size: raw.size ? raw.size.trim() || null : null,
      material: raw.material ? raw.material.trim() || null : null,
      sku_variant: raw.sku_variant ? raw.sku_variant.trim() || null : null,
    };

    if (hasQuantityStock) {
      const stockRaw = raw.quantity_stock?.trim() ?? "";
      updateData.quantity_stock = stockRaw === "" ? 0 : Number(stockRaw);
    }

    if (hasPriceOverride) {
      const priceRaw = raw.price_override?.trim() ?? "";
      updateData.price_override = priceRaw === "" ? null : Number(priceRaw);
    }

    const parsed = updateProductVariantSchema.safeParse(updateData);
    if (!parsed.success) {
      const first =
        parsed.error.issues[0]?.message ?? "Invalid variant data";
      return { success: false, error: first };
    }

    await updateProductVariantService(variantIdParsed.data, parsed.data);

    revalidatePath("/admin/products", "layout");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error in updateProductVariantAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update product variant",
    };
  }
}

export async function deleteProductVariantAction(
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    const variantIdRaw = formData.get("variant_id")?.toString();
    if (!variantIdRaw) {
      return { success: false, error: "Variant ID is required" };
    }

    const variantIdParsed = idSchema.safeParse(variantIdRaw);
    if (!variantIdParsed.success) {
      return { success: false, error: "Invalid variant ID" };
    }

    const deleted = await deleteProductVariantService(variantIdParsed.data);
    if (!deleted) {
      return { success: false, error: "Failed to delete product variant" };
    }

    revalidatePath("/admin/products", "layout");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error in deleteProductVariantAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete product variant",
    };
  }
}

/**
 * Get all products for admin (for dropdowns, etc.).
 */
export async function getAdminProductsAction(): Promise<ProductWithRelations[]> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    return await getAdminProductsService();
  } catch (error) {
    console.error("Unexpected error in getAdminProductsAction:", error);
    return [];
  }
}

/**
 * Get all variants for a product.
 */
export async function getProductVariantsAction(
  productId: string,
): Promise<ProductVariant[]> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    return await getProductVariantsByProductIdService(productId);
  } catch (error) {
    console.error("Unexpected error in getProductVariantsAction:", error);
    return [];
  }
}
