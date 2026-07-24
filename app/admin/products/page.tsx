import { Button } from "@/components/ui/button";
import { Eye, Plus } from "lucide-react";
import Link from "@/components/ui/link";
import {
  ProductsCatalogClient,
  type AdminProductRow,
} from "@/components/admin/product/ProductsCatalogClient";
import { ProductStats } from "@/components/admin/product/ProductStats";
import {
  getAdminProductsPageService,
  getAdminProductCatalogStatsService,
  getAdminProductStockFlagsService,
} from "@/services/product.service";
import { getProductVariantsByProductIdsService } from "@/services/product_variant.service";
import { getBrandsService } from "@/services/brand.service";
import { getAdminCategoriesService } from "@/services/categories.service";
import { encryptOrderId } from "@/lib/utils/encryption";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";
import {
  ADMIN_PRODUCTS_TABLE_PAGE_SIZE,
  parseAdminProductsListParams,
} from "@/lib/admin/products-list-params";
import type { ProductVariant } from "@/types/product";

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    brand?: string;
    featured?: string;
    trending?: string;
    active?: string;
    stock?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const listParams = parseAdminProductsListParams(
    params,
    ADMIN_PRODUCTS_TABLE_PAGE_SIZE,
  );

  const [pageResult, catalogStats, brands, categories] = await Promise.all([
    getAdminProductsPageService(listParams),
    getAdminProductCatalogStatsService(),
    getBrandsService(),
    getAdminCategoriesService(),
  ]);

  const stockFlags = await getAdminProductStockFlagsService(
    pageResult.products.map((p) => p.id),
  );

  const variantsByProductId = new Map<string, ProductVariant[]>();
  if (pageResult.products.length > 0) {
    const variants = await getProductVariantsByProductIdsService(
      pageResult.products.map((p) => p.id),
    );
    for (const variant of variants) {
      const list = variantsByProductId.get(variant.product_id) ?? [];
      list.push(variant);
      variantsByProductId.set(variant.product_id, list);
    }
  }

  const tableProducts: AdminProductRow[] = pageResult.products.map((p) => {
    const primaryImage =
      p.images?.find((img) => img.is_primary) ?? p.images?.[0] ?? null;
    const flags = stockFlags[p.id];

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      slug: p.slug,
      brand_id: p.brand_id ?? undefined,
      category_id: p.category_id ?? undefined,
      sku: p.sku ?? undefined,
      price: p.price,
      is_featured: p.is_featured,
      is_trending: p.is_trending,
      is_active: p.is_active,
      image: primaryImage ? primaryImage.url_image : undefined,
      encryptedId: encryptOrderId(p.id),
      hasLowStock: flags?.hasLowStock ?? false,
      hasOutOfStock: flags?.hasOutOfStock ?? false,
      variants: variantsByProductId.get(p.id) ?? [],
    };
  });

  const gridProducts = pageResult.products.map((p) => ({
    ...p,
    encryptedId: encryptOrderId(p.id),
  }));

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Products" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your product catalog
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
          <Link href="/admin/product-views">
            <Button variant="outline" className="w-full sm:w-auto">
              <Eye className="mr-2 h-4 w-4" />
              Product Views
            </Button>
          </Link>
          <Link href="/admin/products/create">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Product
            </Button>
          </Link>
        </div>
      </div>

      <ProductStats stats={catalogStats} />

      <ProductsCatalogClient
        tableProducts={tableProducts}
        gridProducts={gridProducts}
        brands={brands}
        categories={categories}
        totalCount={pageResult.totalCount}
        pageSize={pageResult.pageSize}
        page={pageResult.page}
      />
    </div>
  );
}
