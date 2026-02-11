import AdminCategoriesClient from "./admin-categories-client";
import { getCategories } from "@/services/categories.service";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/actions/category";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <AdminCategoriesClient
      categories={categories}
      createCategoryAction={createCategoryAction}
      updateCategoryAction={updateCategoryAction}
      deleteCategoryAction={deleteCategoryAction}
    />
  );
}
