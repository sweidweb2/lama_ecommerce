import type {
  AdminProductStockFilter,
  GetAdminProductsPageParams,
} from "@/repositories/product.repository";

export const ADMIN_PRODUCTS_TABLE_PAGE_SIZE = 25;
export const ADMIN_PRODUCTS_GRID_PAGE_SIZE = 12;

export type AdminProductsView = "table" | "grid";

const VALID_STOCK = new Set<AdminProductStockFilter>(["all", "low", "out"]);

function parseBooleanFilter(value: string | undefined): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export interface AdminProductListSearchParams {
  page?: string;
  category?: string;
  brand?: string;
  featured?: string;
  trending?: string;
  active?: string;
  stock?: string;
}

export function parseAdminProductsListParams(
  params: AdminProductListSearchParams,
  pageSize: number,
): GetAdminProductsPageParams {
  const stockRaw = params.stock ?? "all";
  const stock: AdminProductStockFilter = VALID_STOCK.has(
    stockRaw as AdminProductStockFilter,
  )
    ? (stockRaw as AdminProductStockFilter)
    : "all";

  const categoryId =
    params.category && params.category !== "all" ? params.category : null;
  const brandId = params.brand && params.brand !== "all" ? params.brand : null;

  return {
    page: Math.max(1, Number(params.page) || 1),
    pageSize,
    categoryId,
    brandId,
    isFeatured: parseBooleanFilter(params.featured),
    isTrending: parseBooleanFilter(params.trending),
    isActive: parseBooleanFilter(params.active),
    stock,
  };
}
