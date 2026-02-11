import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  type CreateBrandInput,
  type UpdateBrandInput,
} from "@/repositories/brand.repository";
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

export async function createBrandService(
  input: CreateBrandInput,
): Promise<Brand | null> {
  try {
    const newBrand = await createBrand(input);
    if (newBrand === null) {
      return null;
    }
    return newBrand;
  } catch (error) {
    console.error("Unexpected error in createBrandService:", error);
    return null;
  }
}

export async function updateBrandService(
  input: UpdateBrandInput,
): Promise<Brand | null> {
  try {
    const updated = await updateBrand(input);
    if (updated === null) {
      return null;
    }
    return updated;
  } catch (error) {
    console.error("Unexpected error in updateBrandService:", error);
    return null;
  }
}

export async function deleteBrandService(id: string): Promise<boolean> {
  try {
    return await deleteBrand(id);
  } catch (error) {
    console.error("Unexpected error in deleteBrandService:", error);
    return false;
  }
}