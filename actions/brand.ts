"use server";

import {
  createBrandService,
  updateBrandService,
  deleteBrandService,
} from "@/services/brand.service";
import { getCurrentUserProfile } from "@/services/profile.service";
import { ROLES } from "@/lib/constants/roles";
import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

export async function createBrandAction(formData: FormData): Promise<void> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    const name = formData.get("name")?.toString().trim();
    const slugRaw = formData.get("slug")?.toString().trim();
    const logoFile = formData.get("logo_file");

    if (!name) {
      throw new Error("Name is required");
    }

    const slug = slugRaw || null;
    let logo_image_url: string | null = null;

    if (logoFile && logoFile instanceof File && logoFile.size > 0) {
      const supabase = await createSupabaseServerActionClient();
      const ext = logoFile.type.split("/")[1] || "png";
      const filePath = `brands/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("brands")
        .upload(filePath, logoFile, {
          contentType: logoFile.type || "image/*",
        });

      if (uploadError) {
        console.error("Error uploading brand logo:", uploadError);
        throw new Error("Failed to upload brand logo");
      }

      const { data } = supabase.storage
        .from("brands")
        .getPublicUrl(filePath);

      logo_image_url = data.publicUrl ?? null;
    }

    const newBrand = await createBrandService({
      name,
      slug,
      logo_image_url,
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
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    const id = formData.get("id")?.toString();
    const name = formData.get("name")?.toString().trim();
    const slugRaw = formData.get("slug")?.toString().trim();
    const currentLogoUrl = formData.get("current_logo_url")?.toString() || null;
    const logoFile = formData.get("logo_file");

    if (!id || !name) {
      throw new Error("Invalid payload");
    }

    const slug = slugRaw || null;
    let logo_image_url: string | null = currentLogoUrl;

    const supabase = await createSupabaseServerActionClient();

    // If a new file is provided, delete old image (if any) and upload new
    if (logoFile && logoFile instanceof File && logoFile.size > 0) {
      if (currentLogoUrl) {
        const url = new URL(currentLogoUrl);
        const pathIndex = url.pathname.lastIndexOf("/brands/");
        if (pathIndex !== -1) {
          const objectPath = url.pathname.substring(pathIndex + 1); // includes "brands/..."
          const { error: removeError } = await supabase.storage
            .from("brands")
            .remove([objectPath]);
          if (removeError) {
            console.error("Error deleting old brand logo:", removeError);
          }
        }
      }

      const ext = logoFile.type.split("/")[1] || "png";
      const filePath = `brands/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("brands")
        .upload(filePath, logoFile, {
          contentType: logoFile.type || "image/*",
        });

      if (uploadError) {
        console.error("Error uploading new brand logo:", uploadError);
        throw new Error("Failed to upload brand logo");
      }

      const { data } = supabase.storage
        .from("brands")
        .getPublicUrl(filePath);

      logo_image_url = data.publicUrl ?? null;
    }

    const updated = await updateBrandService({
      id,
      name,
      slug,
      logo_image_url,
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
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== ROLES.ADMIN) {
      throw new Error("Unauthorized");
    }

    const id = formData.get("id")?.toString();
    const logoUrl = formData.get("logo_url")?.toString() || null;

    if (!id) {
      throw new Error("Invalid payload");
    }

    const supabase = await createSupabaseServerActionClient();

    if (logoUrl) {
      const url = new URL(logoUrl);
      const pathIndex = url.pathname.lastIndexOf("/brands/");
      if (pathIndex !== -1) {
        const objectPath = url.pathname.substring(pathIndex + 1); // includes "brands/..."
        const { error: removeError } = await supabase.storage
          .from("brands")
          .remove([objectPath]);
        if (removeError) {
          console.error("Error deleting brand logo:", removeError);
        }
      }
    }

    const success = await deleteBrandService(id);

    if (!success) {
      throw new Error("Failed to delete brand");
    }

    revalidatePath("/admin/brands");
  } catch (error) {
    console.error("Unexpected error in deleteBrandAction:", error);
    throw error;
  }
}