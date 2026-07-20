import { CreateProductForm } from "@/components/admin/product/CreateProductForm";
import { createProductAction } from "@/actions/product";
import { getBrandsService } from "@/services/brand.service";
import { getAdminCategoriesService } from "@/services/categories.service";
import { ProductsSectionBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";

export default async function CreateProductPage() {
  const [brands, categories] = await Promise.all([
    getBrandsService(),
    getAdminCategoriesService(),
  ]);

  return (
    <div className="space-y-6">
      <ProductsSectionBreadcrumbs current="Create Product" />
      <CreateProductForm
        action={createProductAction}
        brands={brands}
        categories={categories}
      />
    </div>
  );
}
