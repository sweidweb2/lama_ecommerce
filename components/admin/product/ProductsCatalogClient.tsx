"use client";

import { useEffect, useState } from "react";
import { ProductsTable } from "@/components/admin/product/ProductsTable";
import { ProductsViewToggle } from "@/components/admin/product/ProductsViewToggle";
import { ProductsFilters } from "@/components/admin/product/ProductsFilters";
import { AdminProductGrid } from "@/components/admin/product/AdminProductGrid";
import { AdminPagination } from "@/components/admin/product/AdminPagination";
import type { AdminProduct } from "@/components/admin/product/edit_form";
import type { AdminProductsView } from "@/lib/admin/products-list-params";
import type { Brand, Category, ProductVariant, ProductWithRelations } from "@/types/product";

const VIEW_STORAGE_KEY = "admin-products-view";

export type AdminProductRow = AdminProduct & {
  encryptedId?: string;
  hasLowStock?: boolean;
  hasOutOfStock?: boolean;
  variants?: ProductVariant[];
};

type GridProduct = ProductWithRelations & { encryptedId?: string };

interface ProductsCatalogClientProps {
  tableProducts: AdminProductRow[];
  gridProducts: GridProduct[];
  brands: Brand[];
  categories: Category[];
  totalCount: number;
  pageSize: number;
  page: number;
}

export function ProductsCatalogClient({
  tableProducts,
  gridProducts,
  brands,
  categories,
  totalCount,
  pageSize,
  page,
}: ProductsCatalogClientProps) {
  const [view, setView] = useState<AdminProductsView>("table");

  useEffect(() => {
    const stored = window.sessionStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "grid" || stored === "table") {
      setView(stored);
    }
  }, []);

  const handleViewChange = (next: AdminProductsView) => {
    setView(next);
    window.sessionStorage.setItem(VIEW_STORAGE_KEY, next);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const showingStart =
    gridProducts.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const showingEnd = (page - 1) * pageSize + gridProducts.length;

  return (
    <div className="space-y-6">
      <ProductsViewToggle currentView={view} onViewChange={handleViewChange} />

      <ProductsFilters brands={brands} categories={categories} />

      {view === "table" ? (
        <ProductsTable
          products={tableProducts}
          brands={brands}
          categories={categories}
          totalCount={totalCount}
          pageSize={pageSize}
          page={page}
        />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="text-foreground font-medium">{showingStart}</span>
            {" - "}
            <span className="text-foreground font-medium">{showingEnd}</span>
            {" of "}
            <span className="text-foreground font-medium">{totalCount}</span>
            {" products"}
          </p>

          {totalPages > 1 && (
            <AdminPagination
              totalPages={totalPages}
              basePath="/admin/products"
            />
          )}

          <AdminProductGrid
            products={gridProducts}
            brands={brands}
            categories={categories}
          />

          {totalPages > 1 && (
            <AdminPagination
              totalPages={totalPages}
              basePath="/admin/products"
            />
          )}
        </div>
      )}
    </div>
  );
}
