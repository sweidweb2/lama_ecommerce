"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserProfile } from "@/services/profile.service";
import { ROLES } from "@/lib/constants/roles";
import { createProductService } from "@/services/product.service";
import { createProductSchema } from "@/lib/validators/product/create";

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

    revalidatePath("/admin/products");
  } catch (error) {
    console.error("Unexpected error in createProductAction:", error);
    throw error;
  }
}

