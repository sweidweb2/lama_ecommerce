import { StatCard } from "@/components/admin/stat-card"
import { Package, CheckCircle, Star, TrendingUp } from "lucide-react"
import type { AdminProductCatalogStats } from "@/repositories/product.repository"

interface ProductStatsProps {
  stats: AdminProductCatalogStats
}

export function ProductStats({ stats }: ProductStatsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Products"
        value={stats.total}
        description="All products in catalog"
        icon={Package}
      />
      <StatCard
        title="Active Products"
        value={stats.active}
        description="Currently visible"
        icon={CheckCircle}
      />
      <StatCard
        title="Featured Products"
        value={stats.featured}
        description="Featured items"
        icon={Star}
      />
      <StatCard
        title="Trending Products"
        value={stats.trending}
        description="Hot items"
        icon={TrendingUp}
      />
    </div>
  )
}
