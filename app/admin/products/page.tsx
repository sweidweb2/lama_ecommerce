import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ProductsTable } from "@/components/admin/product/ProductsTable";
import { ProductStats } from "@/components/admin/product/ProductStats";
import { type AdminProduct } from "@/components/admin/product/edit_form";
import { getAdminProductsService } from "@/services/product.service";

export default async function ProductsPage() {
  const productsFromDb = await getAdminProductsService();

  const adminProducts: AdminProduct[] = productsFromDb.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    slug: p.slug ?? undefined,
    brand_id: p.brand_id ?? undefined,
    category_id: p.category_id ?? undefined,
    sku: p.sku ?? undefined,
    price: p.price,
    is_featured: p.is_featured,
    is_trending: p.is_trending,
    is_active: p.is_active,
    image: undefined,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your product catalog
          </p>
        </div>
        <Link href="/admin/products/create">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Product
          </Button>
        </Link>
      </div>

      <ProductStats products={adminProducts} />

      <ProductsTable products={adminProducts} />
    </div>
  );
}
