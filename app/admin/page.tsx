import { StatCard } from "@/components/admin/stat-card"
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
} from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Overview of your e-commerce platform
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value="12,345"
          description="Active users"
          icon={Users}
          trend={{ value: "+12.5%", isPositive: true }}
        />
        <StatCard
          title="Total Products"
          value="1,234"
          description="In stock"
          icon={Package}
          trend={{ value: "+5.2%", isPositive: true }}
        />
        <StatCard
          title="Total Orders"
          value="8,901"
          description="This month"
          icon={ShoppingCart}
          trend={{ value: "+18.3%", isPositive: true }}
        />
        <StatCard
          title="Revenue"
          value="$124,567"
          description="This month"
          icon={DollarSign}
          trend={{ value: "+22.1%", isPositive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">New order #1234</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Product updated</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">New user registered</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending Orders</span>
              <span className="font-semibold">23</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Low Stock Items</span>
              <span className="font-semibold">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Unanswered Q&A</span>
              <span className="font-semibold">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending Reviews</span>
              <span className="font-semibold">5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
