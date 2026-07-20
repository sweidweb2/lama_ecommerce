import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  type CreateBrandInput,
  type UpdateBrandInput,
} from "@/repositories/brand.repository";
import {
  extractStorageObjectPath,
  getPublicUrl,
  removeFiles,
  uploadPublicFile,
} from "@/repositories/storage.repository";
import {
  createBrandSchema,
  updateBrandSchema,
} from "@/lib/validators/brand";
import type { Brand } from "@/types/product";

export async function getBrandsService(): Promise<Brand[]> {
  try {
    const brands = await getBrands();
    if (brands.length === 0) {
      return [];
    }
    return brands;
  } catch (error) {
    console.error("Unexpected error in getBrandsService:", error);
    return [];
  }
}

async function uploadBrandLogo(logoFile: File): Promise<string> {
  const ext = logoFile.type.split("/")[1] || "png";
  const filePath = `brands/${crypto.randomUUID()}.${ext}`;

  const upload = await uploadPublicFile(
    "brands",
    filePath,
    logoFile,
    logoFile.type || "image/*",
  );

  if (!upload.success) {
    throw new Error("Failed to upload brand logo");
  }

  const url = await getPublicUrl("brands", filePath);
  if (!url) {
    throw new Error("Failed to resolve brand logo URL");
  }
  return url;
}

async function removeBrandLogo(logoUrl: string | null | undefined): Promise<void> {
  if (!logoUrl) return;
  const objectPath = extractStorageObjectPath(logoUrl, "brands");
  if (!objectPath) return;
  const removed = await removeFiles("brands", [objectPath]);
  if (!removed.success) {
    console.error("Error deleting brand logo:", removed.error);
  }
}

export async function createBrandService(input: {
  name: string;
  slug?: string | null;
  logoFile?: File | null;
}): Promise<Brand | null> {
  await requireAdmin();
  try {
    const parsed = createBrandSchema.parse({
      name: input.name,
      slug: input.slug ?? null,
    });

    let logo_image_url: string | null = null;
    if (input.logoFile && input.logoFile.size > 0) {
      logo_image_url = await uploadBrandLogo(input.logoFile);
    }

    const payload: CreateBrandInput = {
      name: parsed.name,
      slug: parsed.slug ?? null,
      logo_image_url,
    };

    return await createBrand(payload);
  } catch (error) {
    console.error("Unexpected error in createBrandService:", error);
    throw error;
  }
}

export async function updateBrandService(input: {
  id: string;
  name: string;
  slug?: string | null;
  currentLogoUrl?: string | null;
  logoFile?: File | null;
}): Promise<Brand | null> {
  await requireAdmin();
  try {
    const parsed = updateBrandSchema.parse({
      name: input.name,
      slug: input.slug ?? null,
    });

    let logo_image_url: string | null = input.currentLogoUrl ?? null;

    if (input.logoFile && input.logoFile.size > 0) {
      await removeBrandLogo(input.currentLogoUrl);
      logo_image_url = await uploadBrandLogo(input.logoFile);
    }

    const payload: UpdateBrandInput = {
      id: input.id,
      name: parsed.name,
      slug: parsed.slug ?? null,
      logo_image_url,
    };

    return await updateBrand(payload);
  } catch (error) {
    console.error("Unexpected error in updateBrandService:", error);
    throw error;
  }
}

export async function deleteBrandService(
  id: string,
  logoUrl?: string | null,
): Promise<boolean> {
  await requireAdmin();
  try {
    const deleted = await deleteBrand(id);
    if (deleted) {
      await removeBrandLogo(logoUrl);
    }
    return deleted;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Cannot delete brand:")
    ) {
      throw error;
    }
    console.error("Unexpected error in deleteBrandService:", error);
    return false;
  }
}
