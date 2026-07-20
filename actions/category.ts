"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUserProfile } from "@/services/profile.service";
import { ROLES } from "@/lib/constants/roles";
import {
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from "@/services/category.service";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validators/category";

const idSchema = z.string().uuid();

export async function createCategoryAction(formData: FormData): Promise<void> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    const raw = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      parent_id: formData.get("parent_id"),
      is_active: formData.get("is_active"),
    };

    const parsed = createCategorySchema.parse({
      name: raw.name?.toString().trim(),
      slug: raw.slug?.toString().trim() ?? "",
      parent_id: raw.parent_id
        ? raw.parent_id.toString().trim() || null
        : null,
      is_active:
        raw.is_active !== null && raw.is_active !== undefined
          ? raw.is_active === "on" || raw.is_active === "true"
          : true,
    });

    const created = await createCategoryService(parsed);
    if (!created) {
      throw new Error("Failed to create category");
    }

    revalidatePath("/admin/categories");
  } catch (error) {
    console.error("Unexpected error in createCategoryAction:", error);
    throw error;
  }
}

export async function updateCategoryAction(formData: FormData): Promise<void> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    const idRaw = formData.get("id")?.toString();
    const id = idSchema.parse(idRaw);

    const raw = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      parent_id: formData.get("parent_id"),
      is_active: formData.get("is_active"),
    };

    const parentIdRaw = raw.parent_id?.toString().trim();

    const parsed = updateCategorySchema.parse({
      name: raw.name ? raw.name.toString().trim() : undefined,
      slug:
        raw.slug === null || raw.slug === undefined
          ? undefined
          : raw.slug.toString().trim(),
      parent_id:
        parentIdRaw === undefined
          ? undefined
          : parentIdRaw === ""
          ? null
          : parentIdRaw,
      is_active:
        raw.is_active !== null && raw.is_active !== undefined
          ? raw.is_active === "on" || raw.is_active === "true"
          : undefined,
    });

    const updated = await updateCategoryService(id, parsed);
    if (!updated) {
      throw new Error("Failed to update category");
    }

    revalidatePath("/admin/categories");
  } catch (error) {
    console.error("Unexpected error in updateCategoryAction:", error);
    throw error;
  }
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    const idRaw = formData.get("id")?.toString();
    const id = idSchema.parse(idRaw);

    const success = await deleteCategoryService(id);
    if (!success) {
      throw new Error("Failed to delete category");
    }

    revalidatePath("/admin/categories");
  } catch (error) {
    console.error("Unexpected error in deleteCategoryAction:", error);
    throw error;
  }
}

