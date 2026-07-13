import AdminCategoriesClient from "./admin-categories-client";
import { getCategoriesService } from "@/services/categories.service";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/actions/category";
import { ProductsSectionBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesService();

  return (
    <div className="space-y-6">
      <ProductsSectionBreadcrumbs current="Categories" />
      <AdminCategoriesClient
        categories={categories}
        createCategoryAction={createCategoryAction}
        updateCategoryAction={updateCategoryAction}
        deleteCategoryAction={deleteCategoryAction}
      />
    </div>
  );
}
