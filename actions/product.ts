"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUserProfile } from "@/services/profile.service";
import { ROLES } from "@/lib/constants/roles";
import {
  createProductService,
  updateProductService,
  deleteProductService,
  hardDeleteProductService,
} from "@/services/product.service";
import { createProductSchema } from "@/lib/validators/product/create";
import { updateProductSchema } from "@/lib/validators/product/update";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import {
  createProductImage,
  getProductImagesByProductId,
} from "@/repositories/product_images.repository";
import {
  addProductImageService,
  changePrimaryProductImageService,
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
      const supabase = await createSupabaseServerActionClient();
      const mime = imageFile.type || "image/png";
      const ext = mime.split("/")[1] || "png";
      const filePath = `products/${created.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, imageFile, {
          contentType: mime,
        });

      if (uploadError) {
        console.error("Error uploading product image:", uploadError);
        // Do not fail the whole product creation if image upload fails
      } else {
        const { data } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        const publicUrl = data.publicUrl ?? null;
        if (publicUrl) {
          await createProductImage({
            product_id: created.id,
            url_image: publicUrl,
            is_primary: true,
          });
        }
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

    const mode = await deleteProductService(id);
    if (!mode) {
      throw new Error("Failed to delete product");
    }

    if (mode === "hard") {
      // 1) Clean up storage images for this product.
      const supabase = await createSupabaseServerActionClient();
      const images = await getProductImagesByProductId(id);

      const paths: string[] = [];

      for (const img of images) {
        try {
          const url = new URL(img.url_image);
          const pathIndex = url.pathname.lastIndexOf("/products/");
          if (pathIndex !== -1) {
            const objectPath = url.pathname.substring(pathIndex + 1); // includes "products/..."
            paths.push(objectPath);
          }
        } catch {
          // Ignore invalid URLs
        }
      }

      if (paths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from("products")
          .remove(paths);

        if (removeError) {
          console.error("Error deleting product images from storage:", removeError);
        }
      }

      // 2) Then hard-delete the product row (DB cascades will clear related rows).
      const ok = await hardDeleteProductService(id);
      if (!ok) {
        throw new Error("Failed to hard delete product after storage cleanup");
      }
    }

    revalidatePath("/admin/products");
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

    // Upload image to Supabase storage
    const supabase = await createSupabaseServerActionClient();
    const mime = imageFile.type || "image/png";
    const ext = mime.split("/")[1] || "png";
    const filePath = `products/${productId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filePath, imageFile, {
        contentType: mime,
      });

    if (uploadError) {
      console.error("Error uploading product image:", uploadError);
      throw new Error("Failed to upload image");
    }

    // Get public URL
    const { data } = supabase.storage
      .from("products")
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl ?? null;
    if (!publicUrl) {
      throw new Error("Failed to get public URL for uploaded image");
    }

    // Add product image (service handles primary image logic)
    const success = await addProductImageService(productId, publicUrl);
    if (!success) {
      throw new Error("Failed to create product image record");
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

    const supabase = await createSupabaseServerActionClient();

    // Fetch image row to know if it was primary and to get URL
    const { data: image, error: fetchError } = await supabase
      .from("product_images")
      .select("*")
      .eq("id", imageId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching product image before delete:", fetchError);
      throw new Error("Failed to load product image");
    }

    if (!image) {
      // Already deleted, just revalidate
      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${productId}`);
      return;
    }

    // Delete from storage first (before DB deletion)
    try {
      const url = new URL((image as any).url_image as string);
      const pathIndex = url.pathname.lastIndexOf("/products/");
      if (pathIndex !== -1) {
        const objectPath = url.pathname.substring(pathIndex + 1); // includes "products/..."
        const { error: removeError } = await supabase.storage
          .from("products")
          .remove([objectPath]);

        if (removeError) {
          console.error("Error deleting product image from storage:", removeError);
          // Don't fail the whole operation if storage delete fails, but log it
          // The DB row will still be deleted
        }
      }
    } catch (urlError) {
      // If URL parsing fails, log but continue with DB deletion
      console.error("Error parsing image URL for storage deletion:", urlError);
    }

    // Delete DB row
    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId);

    if (deleteError) {
      console.error("Error deleting product image row:", deleteError);
      throw new Error("Failed to delete product image");
    }

    // If deleted image was primary, promote another image to primary if exists
    if ((image as any).is_primary) {
      const { data: nextImage, error: nextError } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", productId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!nextError && nextImage) {
        await changePrimaryProductImageService(productId, (nextImage as any).id as string);
      }
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
): Promise<void> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
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

    const parsed = createProductVariantSchema.parse({
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

    const created = await createProductVariantService(parsed);
    if (!created) {
      throw new Error("Failed to create product variant");
    }

    // Revalidate the products list and the specific product details page
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${parsed.product_id}`);
  } catch (error) {
    console.error("Unexpected error in createProductVariantAction:", error);
    throw error;
  }
}

export async function updateProductVariantAction(
  formData: FormData,
): Promise<void> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    const variantIdRaw = formData.get("variant_id")?.toString();
    if (!variantIdRaw) {
      throw new Error("Variant ID is required");
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

    // Build update object with only provided fields
    const updateData: any = {};
    if (raw.product_id !== undefined) updateData.product_id = raw.product_id;
    if (raw.color !== undefined) {
      updateData.color = raw.color ? raw.color.trim() || null : null;
    }
    if (raw.size !== undefined) {
      updateData.size = raw.size ? raw.size.trim() || null : null;
    }
    if (raw.material !== undefined) {
      updateData.material = raw.material ? raw.material.trim() || null : null;
    }
    if (raw.quantity_stock !== undefined) {
      updateData.quantity_stock = raw.quantity_stock ? Number(raw.quantity_stock) : 0;
    }
    if (raw.sku_variant !== undefined) {
      updateData.sku_variant = raw.sku_variant ? raw.sku_variant.trim() || null : null;
    }
    if (raw.price_override !== undefined) {
      updateData.price_override = raw.price_override
        ? Number(raw.price_override)
        : null;
    }

    const parsed = updateProductVariantSchema.parse(updateData);

    const updated = await updateProductVariantService(variantIdRaw, parsed);
    if (!updated) {
      throw new Error("Failed to update product variant");
    }

    // Revalidate the products list and the specific product details page
    revalidatePath("/admin/products");
    // Use the product_id from the variant (it should be in the update data or we can fetch it)
    const productId = parsed.product_id || raw.product_id;
    if (productId) {
      revalidatePath(`/admin/products/${productId}`);
    }
  } catch (error) {
    console.error("Unexpected error in updateProductVariantAction:", error);
    throw error;
  }
}

export async function deleteProductVariantAction(
  formData: FormData,
): Promise<void> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    const variantIdRaw = formData.get("variant_id")?.toString();
    const productIdRaw = formData.get("product_id")?.toString();

    if (!variantIdRaw) {
      throw new Error("Variant ID is required");
    }

    const deleted = await deleteProductVariantService(variantIdRaw);
    if (!deleted) {
      throw new Error("Failed to delete product variant");
    }

    // Revalidate the products list and the specific product details page
    revalidatePath("/admin/products");
    if (productIdRaw) {
      revalidatePath(`/admin/products/${productIdRaw}`);
    }
  } catch (error) {
    console.error("Unexpected error in deleteProductVariantAction:", error);
    throw error;
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
