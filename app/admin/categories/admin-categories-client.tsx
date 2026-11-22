'use client';

import { useMemo, useState } from "react";
import type { Category } from "@/types/product";
import { CategoriesHeader } from "@/components/admin/category/categories-header";
import { CategoriesFilters } from "@/components/admin/category/categories-filters";
import { CategoriesTable } from "@/components/admin/category/categories-table";
import { AdminPagination } from "@/components/admin/shared/AdminPagination";

interface AdminCategoriesClientProps {
  categories: Category[];
  productCounts: Record<string, number>;
  createCategoryAction: (formData: FormData) => void | Promise<void>;
  updateCategoryAction: (formData: FormData) => void | Promise<void>;
  deleteCategoryAction: (
    formData: FormData,
  ) => Promise<{ success: true } | { success: false; error: string }>;
}

const ROWS_PER_PAGE = 10;

export default function AdminCategoriesClient({
  categories,
  productCounts,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
}: AdminCategoriesClientProps) {
  const [nameFilter, setNameFilter] = useState("");
  const [parentFilter, setParentFilter] = useState<string | "all">("all");
  const [page, setPage] = useState(1);

  const parentOptions = useMemo(
    () =>
      Array.from(
        new Map(categories.map((c) => [c.id, c])).values(),
      ),
    [categories],
  );

  const filteredCategories = useMemo(() => {
    const nameQuery = nameFilter.trim().toLowerCase();

    return categories.filter((category) => {
      if (nameQuery) {
        const matchesName =
          category.name.toLowerCase().includes(nameQuery) ||
          (category.slug ?? "").toLowerCase().includes(nameQuery);
        if (!matchesName) return false;
      }

      if (parentFilter !== "all") {
        if (parentFilter === "root") {
          if (category.parent_id !== null) return false;
        } else if (category.parent_id !== parentFilter) {
          return false;
        }
      }

      return true;
    });
  }, [categories, nameFilter, parentFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredCategories.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredCategories.slice(start, start + ROWS_PER_PAGE);
  }, [filteredCategories, currentPage]);

  const handleChangePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pageCount) return;
    setPage(nextPage);
  };

  const pageFrom =
    filteredCategories.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const pageTo = Math.min(currentPage * ROWS_PER_PAGE, filteredCategories.length);

  return (
    <div className="space-y-6">
      <CategoriesHeader
        categories={categories}
        createCategoryAction={createCategoryAction}
      />

      <CategoriesFilters
        nameFilter={nameFilter}
        parentFilter={parentFilter}
        parentOptions={parentOptions}
        onNameFilterChange={(value) => {
          setNameFilter(value);
          setPage(1);
        }}
        onParentFilterChange={(value) => {
          setParentFilter(value);
          setPage(1);
        }}
      />

      <CategoriesTable
        categories={paginatedCategories}
        allCategories={categories}
        productCounts={productCounts}
        updateCategoryAction={updateCategoryAction}
        deleteCategoryAction={deleteCategoryAction}
      />

      <AdminPagination
        variant="prev-next"
        itemLabel="categories"
        currentPage={currentPage}
        pageCount={pageCount}
        totalItems={filteredCategories.length}
        pageFrom={pageFrom}
        pageTo={pageTo}
        onPageChange={handleChangePage}
      />
    </div>
  );
}
