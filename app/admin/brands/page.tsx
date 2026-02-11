import AdminBrandsClient from "./admin-brands-client"
import { getBrandsService } from "@/services/brand.service"
import {
  createBrandAction,
  updateBrandAction,
  deleteBrandAction,
} from "@/actions/brand"

export default async function AdminBrandsPage() {
  const brands = await getBrandsService()

  return (
    <AdminBrandsClient
      brands={brands}
      createBrandAction={createBrandAction}
      updateBrandAction={updateBrandAction}
      deleteBrandAction={deleteBrandAction}
    />
  )
}
