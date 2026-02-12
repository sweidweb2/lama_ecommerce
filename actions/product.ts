"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUserProfile } from "@/services/profile.service";
import { ROLES } from "@/lib/constants/roles";
import { createProductService, updateProductService } from "@/services/product.service";
import { createProductSchema } from "@/lib/validators/product/create";
import { updateProductSchema } from "@/lib/validators/product/update";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { createProductImage } from "@/repositories/product_images.repository";

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

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
  } catch (error) {
    console.error("Unexpected error in updateProductAction:", error);
    throw error;
  }
}
