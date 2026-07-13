import { ProductViewsTable } from "@/components/admin/product_view/ProductViewsTable";
import { ProductViewsStatCard } from "@/components/admin/product_view/ProductViewsStatCard";
import {
  getAllProductViewsAction,
  getProductViewsStatsAction,
} from "@/actions/product_view";
import {
  Eye,
  Users,
  Calendar,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { ProductsSectionBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

interface ProductViewsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function ProductViewsPage({
  searchParams,
}: ProductViewsPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, Math.min(Number(params.page) || 1, 200));
  const pageSize = 50;

  const [viewsData, stats] = await Promise.all([
    getAllProductViewsAction(currentPage, pageSize),
    getProductViewsStatsAction(),
  ]);

  return (
    <div className="space-y-6">
      <ProductsSectionBreadcrumbs current="Product Views" />
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Product Views</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Track and analyze product view analytics
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <ProductViewsStatCard
          title="Total Views"
          value={formatNumber(stats.totalViews)}
          description="All time"
          icon={Eye}
          borderColor="#3b82f6"
        />
        <ProductViewsStatCard
          title="Unique Users"
          value={formatNumber(stats.uniqueUsers)}
          description="Registered users"
          icon={Users}
          borderColor="#f59e0b"
        />
        <ProductViewsStatCard
          title="Views Today"
          value={formatNumber(stats.viewsToday)}
          description="Last 24 hours"
          icon={Calendar}
          borderColor="#ef4444"
        />
        <ProductViewsStatCard
          title="Views This Week"
          value={formatNumber(stats.viewsThisWeek)}
          description="Last 7 days"
          icon={TrendingUp}
          borderColor="#8b5cf6"
        />
        <ProductViewsStatCard
          title="Views This Month"
          value={formatNumber(stats.viewsThisMonth)}
          description="Current month"
          icon={BarChart3}
          borderColor="#ec4899"
        />
      </div>

      {/* Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {viewsData.data.length > 0
                  ? (currentPage - 1) * pageSize + 1
                  : 0}
              </span>
              {" - "}
              <span className="font-medium text-foreground">
                {(currentPage - 1) * pageSize + viewsData.data.length}
              </span>
              {" of "}
              <span className="font-medium text-foreground">
                {formatNumber(viewsData.total)}
              </span>
              {" views"}
            </p>
          </div>
        </div>

        <ProductViewsTable
          views={viewsData.data}
          currentPage={currentPage}
          totalPages={viewsData.totalPages}
        />
      </div>
    </div>
  );
}
