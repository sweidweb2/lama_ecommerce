"use server";

import {
  createBrandService,
  updateBrandService,
  deleteBrandService,
} from "@/services/brand.service";
import { revalidatePath } from "next/cache";

export async function createBrandAction(formData: FormData): Promise<void> {
  try {
    const name = formData.get("name")?.toString().trim();
    const slugRaw = formData.get("slug")?.toString().trim();
    const logoFile = formData.get("logo_file");

    if (!name) {
      throw new Error("Name is required");
    }

    const newBrand = await createBrandService({
      name,
      slug: slugRaw || null,
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
    const id = formData.get("id")?.toString();
    const name = formData.get("name")?.toString().trim();
    const slugRaw = formData.get("slug")?.toString().trim();
    const currentLogoUrl = formData.get("current_logo_url")?.toString() || null;
    const logoFile = formData.get("logo_file");

    if (!id || !name) {
      throw new Error("Invalid payload");
    }

    const updated = await updateBrandService({
      id,
      name,
      slug: slugRaw || null,
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
    const id = formData.get("id")?.toString();
    const logoUrl = formData.get("logo_url")?.toString() || null;

    if (!id) {
      throw new Error("Invalid payload");
    }

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
