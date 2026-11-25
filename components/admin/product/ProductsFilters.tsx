"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  AdminFilterBar,
  type AdminFilterField,
} from "@/components/admin/shared/admin-filter-bar";
import { useUrlFilters } from "@/components/admin/shared/use-url-filters";
import type { Brand, Category } from "@/types/product";

const FILTER_KEYS = ["category", "brand", "active", "stock"] as const;

interface ProductsFiltersProps {
  brands: Brand[];
  categories: Category[];
  /** Soft-nav wrapper so the catalog can show an in-table loader while results load. */
  onNavigate?: (href: string) => void;
}

function selectValueOrAll(current: string, validIds: Set<string>): string {
  if (current === "all" || current === "") return "all";
  return validIds.has(current) ? current : "all";
}

export function ProductsFilters({
  brands,
  categories,
  onNavigate,
}: ProductsFiltersProps) {
  const searchParams = useSearchParams();
  const { values, setValue, clear } = useUrlFilters({
    keys: FILTER_KEYS,
    debounceMs: 0,
    navigate: onNavigate,
  });

  const categoryIds = useMemo(
    () => new Set(categories.map((c) => c.id)),
    [categories],
  );
  const brandIds = useMemo(() => new Set(brands.map((b) => b.id)), [brands]);

  const fields = useMemo<AdminFilterField[]>(
    () => [
      {
        type: "select",
        key: "category",
        label: "Category",
        allValue: "all",
        className: "w-[180px]",
        options: categories.map((category) => ({
          value: category.id,
          label: category.is_active
            ? category.name
            : `${category.name} (inactive)`,
        })),
      },
      {
        type: "select",
        key: "brand",
        label: "Brand",
        allValue: "all",
        className: "w-[180px]",
        options: brands.map((brand) => ({
          value: brand.id,
          label: brand.name,
        })),
      },
      {
        type: "select",
        key: "active",
        label: "Status",
        allValue: "all",
        className: "w-[150px]",
        options: [
          { value: "true", label: "Active" },
          { value: "false", label: "Inactive" },
        ],
      },
      {
        type: "select",
        key: "stock",
        label: "Stock",
        allValue: "all",
        className: "w-[150px]",
        options: [
          { value: "low", label: "Low stock" },
          { value: "out", label: "Out of stock" },
        ],
      },
    ],
    [brands, categories],
  );

  const categoryFilter = selectValueOrAll(values.category || "all", categoryIds);
  const brandFilter = selectValueOrAll(values.brand || "all", brandIds);
  const activeFilter =
    values.active === "true" || values.active === "false"
      ? values.active
      : "";
  const stockFilter =
    values.stock === "low" || values.stock === "out" ? values.stock : "";

  const displayValues = useMemo(
    () => ({
      category: categoryFilter === "all" ? "" : categoryFilter,
      brand: brandFilter === "all" ? "" : brandFilter,
      active: activeFilter,
      stock: stockFilter,
    }),
    [categoryFilter, brandFilter, activeFilter, stockFilter],
  );

  const featuredParam = searchParams.get("featured");
  const trendingParam = searchParams.get("trending");

  const hasActiveFilters =
    categoryFilter !== "all" ||
    brandFilter !== "all" ||
    activeFilter !== "" ||
    stockFilter !== "" ||
    featuredParam === "true" ||
    featuredParam === "false" ||
    trendingParam === "true" ||
    trendingParam === "false";

  return (
    <AdminFilterBar
      fields={fields}
      values={displayValues}
      onChange={setValue}
      onClear={clear}
      showClear={hasActiveFilters}
      clearLabel="Clear Filters"
      className="flex flex-wrap gap-4 items-end"
    />
  );
}
