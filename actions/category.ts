"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  formBool,
  formString,
  formStringIfPresent,
} from "@/lib/actions/form-helpers";
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
    await requireAdmin();

    const parsed = createCategorySchema.parse({
      name: formString(formData, "name") ?? undefined,
      slug: formString(formData, "slug") ?? "",
      parent_id: formString(formData, "parent_id"),
      is_active: formBool(formData, "is_active", true),
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
    await requireAdmin();

    const id = idSchema.parse(formData.get("id")?.toString());

    const parsed = updateCategorySchema.parse({
      name: formStringIfPresent(formData, "name") ?? undefined,
      slug: formStringIfPresent(formData, "slug") ?? undefined,
      parent_id: formStringIfPresent(formData, "parent_id"),
      is_active: formBool(formData, "is_active"),
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

export async function deleteCategoryAction(
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireAdmin();

    const id = idSchema.parse(formData.get("id")?.toString());

    const success = await deleteCategoryService(id);
    if (!success) {
      return { success: false, error: "Failed to delete category" };
    }

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error in deleteCategoryAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}
