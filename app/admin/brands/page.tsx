import AdminBrandsClient from "./admin-brands-client"
import { getBrandsService } from "@/services/brand.service"
import {
  createBrandAction,
  updateBrandAction,
  deleteBrandAction,
} from "@/actions/brand"
import { ProductsSectionBreadcrumbs } from "@/components/admin/AdminBreadcrumbs"

export default async function AdminBrandsPage() {
  const brands = await getBrandsService()

  return (
    <div className="space-y-6">
      <ProductsSectionBreadcrumbs current="Brands" />
      <AdminBrandsClient
        brands={brands}
        createBrandAction={createBrandAction}
        updateBrandAction={updateBrandAction}
        deleteBrandAction={deleteBrandAction}
      />
    </div>
  )
}
