'use client';

import { useMemo, useState } from "react";
import type { Category } from "@/types/product";
import { CategoriesHeader } from "@/components/admin/category/categories-header";
import { CategoriesFilters } from "@/components/admin/category/categories-filters";
import { CategoriesTable } from "@/components/admin/category/categories-table";
import { CategoriesPagination } from "@/components/admin/category/categories-pagination";

interface AdminCategoriesClientProps {
  categories: Category[];
  createCategoryAction: (formData: FormData) => void | Promise<void>;
  updateCategoryAction: (formData: FormData) => void | Promise<void>;
  deleteCategoryAction: (formData: FormData) => void | Promise<void>;
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
const MAX_ROWS_PER_PAGE = 50;

export default function AdminCategoriesClient({
  categories,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
}: AdminCategoriesClientProps) {
  const [nameFilter, setNameFilter] = useState("");
  const [parentFilter, setParentFilter] = useState<string | "all">("all");
  const [rowsPerPage, setRowsPerPage] = useState<number>(ROWS_PER_PAGE_OPTIONS[0]);
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

  const safeRowsPerPage = Math.min(rowsPerPage, MAX_ROWS_PER_PAGE);
  const pageCount = Math.max(1, Math.ceil(filteredCategories.length / safeRowsPerPage));
  const currentPage = Math.min(page, pageCount);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * safeRowsPerPage;
    return filteredCategories.slice(start, start + safeRowsPerPage);
  }, [filteredCategories, currentPage, safeRowsPerPage]);

  const handleChangeRowsPerPage = (value: string) => {
    const next = Number(value) || ROWS_PER_PAGE_OPTIONS[0];
    const clamped = Math.min(next, MAX_ROWS_PER_PAGE);
    setRowsPerPage(clamped);
    setPage(1);
  };

  const handleChangePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pageCount) return;
    setPage(nextPage);
  };

  const pageFrom =
    filteredCategories.length === 0 ? 0 : (currentPage - 1) * safeRowsPerPage + 1;
  const pageTo = Math.min(currentPage * safeRowsPerPage, filteredCategories.length);

  return (
    <div className="space-y-6">
      <CategoriesHeader
        categories={categories}
        createCategoryAction={createCategoryAction}
      />

      <CategoriesFilters
        nameFilter={nameFilter}
        parentFilter={parentFilter}
        rowsPerPage={safeRowsPerPage}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        parentOptions={parentOptions}
        onNameFilterChange={(value) => {
          setNameFilter(value);
          setPage(1);
        }}
        onParentFilterChange={(value) => {
          setParentFilter(value);
          setPage(1);
        }}
        onRowsPerPageChange={(value) => handleChangeRowsPerPage(String(value))}
      />

      <CategoriesTable
        categories={paginatedCategories}
        allCategories={categories}
        updateCategoryAction={updateCategoryAction}
        deleteCategoryAction={deleteCategoryAction}
      />

      <CategoriesPagination
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
