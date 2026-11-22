"use client";

import { useEffect, useState, useTransition, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductsTable } from "@/components/admin/product/ProductsTable";
import { ProductsViewToggle } from "@/components/admin/product/ProductsViewToggle";
import { ProductsFilters } from "@/components/admin/product/ProductsFilters";
import { AdminProductGrid } from "@/components/admin/product/AdminProductGrid";
import { AdminUrlPagination } from "@/components/admin/product/AdminUrlPagination";
import type { AdminProduct } from "@/components/admin/product/edit_form";
import type { AdminProductsView } from "@/lib/admin/products-list-params";
import type { Brand, Category, ProductVariant, ProductWithRelations } from "@/types/product";
import { cn } from "@/lib/utils";

const VIEW_STORAGE_KEY = "admin-products-view";
const FILTER_LOADER_TIMEOUT_MS = 10_000;

function subscribeToProductsView(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === VIEW_STORAGE_KEY || event.key === null) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

function getProductsViewSnapshot(): AdminProductsView {
  const stored = window.sessionStorage.getItem(VIEW_STORAGE_KEY);
  return stored === "grid" ? "grid" : "table";
}

function getProductsViewServerSnapshot(): AdminProductsView {
  return "table";
}

function setProductsView(next: AdminProductsView) {
  window.sessionStorage.setItem(VIEW_STORAGE_KEY, next);
  // Same-tab listeners: storage events only fire across tabs.
  window.dispatchEvent(
    new StorageEvent("storage", { key: VIEW_STORAGE_KEY, newValue: next }),
  );
}

function searchKeyFromHref(href: string): string {
  try {
    return new URL(href, window.location.origin).searchParams.toString();
  } catch {
    return "";
  }
}

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingSearchKey, setPendingSearchKey] = useState<string | null>(null);

  const view = useSyncExternalStore(
    subscribeToProductsView,
    getProductsViewSnapshot,
    getProductsViewServerSnapshot,
  );

  const currentSearchKey = searchParams.toString();
  // Keep loader until the URL catches up to the navigation we started —
  // derive this (don't clear pending key in an effect).
  const isWaitingForUrl =
    pendingSearchKey !== null && pendingSearchKey !== currentSearchKey;
  const isRefreshing = isPending || isWaitingForUrl;

  useEffect(() => {
    if (pendingSearchKey === null) return;
    const timer = setTimeout(() => {
      setPendingSearchKey(null);
    }, FILTER_LOADER_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [pendingSearchKey]);

  const handleViewChange = (next: AdminProductsView) => {
    setProductsView(next);
  };

  const navigateProducts = (href: string) => {
    const nextKey = searchKeyFromHref(href);
    const path = href.split("?")[0] || "/admin/products";
    if (
      nextKey === currentSearchKey &&
      path === window.location.pathname
    ) {
      return;
    }
    setPendingSearchKey(nextKey);
    startTransition(() => {
      router.push(href);
    });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const showingStart =
    gridProducts.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const showingEnd = (page - 1) * pageSize + gridProducts.length;

  return (
    <div className="space-y-6">
      <ProductsViewToggle currentView={view} onViewChange={handleViewChange} />

      <ProductsFilters
        brands={brands}
        categories={categories}
        onNavigate={navigateProducts}
      />

      {view === "table" ? (
        <ProductsTable
          products={tableProducts}
          brands={brands}
          categories={categories}
          totalCount={totalCount}
          pageSize={pageSize}
          page={page}
          isRefreshing={isRefreshing}
          onNavigate={navigateProducts}
        />
      ) : (
        <div className="relative space-y-6">
          {isRefreshing ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Loading filtered results"
            >
              <div className="table-top-loader-bar h-full w-1/3 bg-primary" />
            </div>
          ) : null}

          <p
            className={cn(
              "text-sm text-muted-foreground",
              isRefreshing && "opacity-70",
            )}
          >
            Showing{" "}
            <span className="text-foreground font-medium">{showingStart}</span>
            {" - "}
            <span className="text-foreground font-medium">{showingEnd}</span>
            {" of "}
            <span className="text-foreground font-medium">{totalCount}</span>
            {" products"}
          </p>

          {totalPages > 1 && (
            <AdminUrlPagination
              totalPages={totalPages}
              basePath="/admin/products"
              onNavigate={navigateProducts}
            />
          )}

          <div className={cn(isRefreshing && "opacity-70 transition-opacity")}>
            <AdminProductGrid
              products={gridProducts}
              brands={brands}
              categories={categories}
            />
          </div>

          {totalPages > 1 && (
            <AdminUrlPagination
              totalPages={totalPages}
              basePath="/admin/products"
              onNavigate={navigateProducts}
            />
          )}
        </div>
      )}
    </div>
  );
}
