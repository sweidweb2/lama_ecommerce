"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createBrandService,
  updateBrandService,
  deleteBrandService,
} from "@/services/brand.service";
import {
  createBrandSchema,
  updateBrandSchema,
} from "@/lib/validators/brand";

const idSchema = z.string().uuid();

export async function createBrandAction(formData: FormData): Promise<void> {
  try {
    await requireAdmin();

    const slugRaw = formData.get("slug")?.toString().trim();
    const logoFile = formData.get("logo_file");

    const parsed = createBrandSchema.parse({
      name: formData.get("name")?.toString().trim(),
      slug: slugRaw ? slugRaw : null,
    });

    const newBrand = await createBrandService({
      ...parsed,
      logoFile:
        logoFile && logoFile instanceof File && logoFile.size > 0
          ? logoFile
          : null,
    });

    if (!newBrand) {
      throw new Error("Failed to create brand");
    }

    revalidatePath("/admin/brands");
  } catch (error) {
    console.error("Unexpected error in createBrandAction:", error);
    throw error;
  }
}

export async function updateBrandAction(formData: FormData): Promise<void> {
  try {
    await requireAdmin();

    const id = idSchema.parse(formData.get("id")?.toString());
    const slugRaw = formData.get("slug")?.toString().trim();
    const currentLogoUrl = formData.get("current_logo_url")?.toString() || null;
    const logoFile = formData.get("logo_file");

    const parsed = updateBrandSchema.parse({
      name: formData.get("name")?.toString().trim(),
      slug: slugRaw ? slugRaw : null,
    });

    const updated = await updateBrandService({
      id,
      ...parsed,
      currentLogoUrl,
      logoFile:
        logoFile && logoFile instanceof File && logoFile.size > 0
          ? logoFile
          : null,
    });

    if (!updated) {
      throw new Error("Failed to update brand");
    }

    revalidatePath("/admin/brands");
  } catch (error) {
    console.error("Unexpected error in updateBrandAction:", error);
    throw error;
  }
}

export async function deleteBrandAction(formData: FormData): Promise<void> {
  try {
    await requireAdmin();

    const id = idSchema.parse(formData.get("id")?.toString());
    const logoUrl = formData.get("logo_url")?.toString() || null;

    const success = await deleteBrandService(id, logoUrl);

    if (!success) {
      throw new Error("Failed to delete brand");
    }

    revalidatePath("/admin/brands");
  } catch (error) {
    console.error("Unexpected error in deleteBrandAction:", error);
    throw error;
  }
}
