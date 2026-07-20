import { Button } from "@/components/ui/button";
import { Eye, Grid3x3, Plus } from "lucide-react";
import Link from "@/components/ui/link";
import { ProductsTable } from "@/components/admin/product/ProductsTable";
import { ProductStats } from "@/components/admin/product/ProductStats";
import { type AdminProduct } from "@/components/admin/product/edit_form";
import {
  getAdminProductsService,
  getAdminProductStockFlagsService,
} from "@/services/product.service";
import { getBrandsService } from "@/services/brand.service";
import { getCategoriesService } from "@/services/categories.service";
import { encryptOrderId } from "@/lib/utils/encryption";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";

export type AdminProductRow = AdminProduct & {
  encryptedId?: string;
  hasLowStock?: boolean;
  hasOutOfStock?: boolean;
};

export default async function ProductsPage() {
  const [productsFromDb, brands, categories] = await Promise.all([
    getAdminProductsService(),
    getBrandsService(),
    getCategoriesService(),
  ]);

  const stockFlags = await getAdminProductStockFlagsService(
    productsFromDb.map((p) => p.id),
  );

  const adminProducts: AdminProductRow[] = productsFromDb.map((p) => {
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
    };
  });

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
          <Link href="/admin/products/grid">
            <Button variant="outline" className="w-full sm:w-auto">
              <Grid3x3 className="mr-2 h-4 w-4" />
              Grid view
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

      <ProductStats products={adminProducts} />

      <ProductsTable
        products={adminProducts}
        brands={brands}
        categories={categories}
      />
    </div>
  );
}
