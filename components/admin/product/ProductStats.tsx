import { StatCard } from "@/components/admin/stat-card"
import { Package, CheckCircle, Star, TrendingUp } from "lucide-react"
import type { AdminProduct } from "./edit_form"
import type { ProductWithRelations } from "@/types/product"

interface ProductStatsProps {
  products: AdminProduct[] | ProductWithRelations[]
}

export function ProductStats({ products }: ProductStatsProps) {
  const totalProducts = products.length
  const activeProducts = products.filter((p) => p.is_active).length
  const featuredProducts = products.filter((p) => p.is_featured).length
  const trendingProducts = products.filter((p) => p.is_trending).length

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Products"
        value={totalProducts}
        description="All products in catalog"
        icon={Package}
      />
      <StatCard
        title="Active Products"
        value={activeProducts}
        description="Currently visible"
        icon={CheckCircle}
      />
      <StatCard
        title="Featured Products"
        value={featuredProducts}
        description="Featured items"
        icon={Star}
      />
      <StatCard
        title="Trending Products"
        value={trendingProducts}
        description="Hot items"
        icon={TrendingUp}
      />
    </div>
  )
}
