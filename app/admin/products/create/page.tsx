import { CreateProductForm } from "@/components/admin/product/CreateProductForm";
import { createProductAction } from "@/actions/product";
import { getBrandsService } from "@/services/brand.service";
import { getCategoriesService } from "@/services/categories.service";

export default async function CreateProductPage() {
  const [brands, categories] = await Promise.all([
    getBrandsService(),
    getCategoriesService(),
  ]);

  return (
    <CreateProductForm
      action={createProductAction}
      brands={brands}
      categories={categories}
    />
  );
}
