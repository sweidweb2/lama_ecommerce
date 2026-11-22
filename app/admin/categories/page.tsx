import AdminCategoriesClient from "./admin-categories-client";
import {
  getAdminCategoriesService,
  getCategoryProductCountsService,
} from "@/services/category.service";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/actions/category";
import { ProductsSectionBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategoriesService();
  const productCounts = await getCategoryProductCountsService(
    categories.map((c) => c.id),
  );

  return (
    <div className="space-y-6">
      <ProductsSectionBreadcrumbs current="Categories" />
      <AdminCategoriesClient
        categories={categories}
        productCounts={productCounts}
        createCategoryAction={createCategoryAction}
        updateCategoryAction={updateCategoryAction}
        deleteCategoryAction={deleteCategoryAction}
      />
    </div>
  );
}
