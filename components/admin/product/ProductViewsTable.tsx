"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getProductViewsByProductIdAction,
  getProductViewsStatsByProductIdAction,
} from "@/actions/product_view";
import type {
  AdminProductViewRow,
  ProductScopedViewsStats,
} from "@/repositories/product_view.repository";
import { ProductViewsStatCard } from "@/components/admin/product_view/ProductViewsStatCard";
import { ProductViewDetailsDialog } from "@/components/admin/product/ProductViewDetailsDialog";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Users,
} from "lucide-react";
import {
  formatNumber,
  formatViewedAtLong,
} from "@/components/admin/product_view/product-views-shared";
import { truncateText } from "@/lib/utils";

interface ProductViewsTableProps {
  productId: string;
}

const VIEWS_PER_PAGE = 25;

const EMPTY_STATS: ProductScopedViewsStats = {
  totalViews: 0,
  uniqueUsers: 0,
  guestViews: 0,
  viewsToday: 0,
  viewsThisWeek: 0,
  viewsThisMonth: 0,
};

export function ProductViewsTable({ productId }: ProductViewsTableProps) {
  const [views, setViews] = useState<AdminProductViewRow[]>([]);
  const [stats, setStats] = useState<ProductScopedViewsStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [userNameFilter, setUserNameFilter] = useState("");
  const [sessionIdFilter, setSessionIdFilter] = useState("");
  const [viewerTypeFilter, setViewerTypeFilter] = useState<string>("all");

  // Fetch stats once per product
  useEffect(() => {
    async function fetchStats() {
      try {
        const statsResult =
          await getProductViewsStatsByProductIdAction(productId);
        setStats(statsResult);
      } catch (err) {
        console.error("Error fetching product view stats:", err);
        setStats(EMPTY_STATS);
      }
    }

    fetchStats();
  }, [productId]);

  // Fetch paginated views
  useEffect(() => {
    async function fetchViews() {
      setLoading(true);
      setError(null);
      try {
        const viewsResult = await getProductViewsByProductIdAction(
          productId,
          currentPage,
          VIEWS_PER_PAGE,
        );
        setViews(viewsResult.data);
        setTotal(viewsResult.total);
        setTotalPages(viewsResult.totalPages);
      } catch (err) {
        console.error("Error fetching product views:", err);
        setError("Failed to load product views");
        setViews([]);
      } finally {
        setLoading(false);
      }
    }

    fetchViews();
  }, [productId, currentPage]);

  // Filter views (client-side filtering on fetched data)
  const filteredViews = useMemo(() => {
    return views.filter((view) => {
      const userName = view.user_name || "";
      const matchesUserName =
        !userNameFilter ||
        userName.toLowerCase().includes(userNameFilter.toLowerCase());

      const sessionId = view.session_id || "";
      const matchesSessionId =
        !sessionIdFilter ||
        sessionId.toLowerCase().includes(sessionIdFilter.toLowerCase());

      let matchesViewerType = true;
      if (viewerTypeFilter === "user") {
        matchesViewerType = view.user_id !== null;
      } else if (viewerTypeFilter === "guest") {
        matchesViewerType = view.user_id === null;
      }

      return matchesUserName && matchesSessionId && matchesViewerType;
    });
  }, [views, userNameFilter, sessionIdFilter, viewerTypeFilter]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setUserNameFilter("");
    setSessionIdFilter("");
    setViewerTypeFilter("all");
  };

  const hasActiveFilters =
    userNameFilter !== "" ||
    sessionIdFilter !== "" ||
    viewerTypeFilter !== "all";

  if (loading && views.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Views</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading product views...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Views</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Views</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid gap-3 grid-cols-2">
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
            description="Registered"
            icon={Users}
            borderColor="#f59e0b"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">User Name</label>
            <Input
              placeholder="Filter by user name..."
              value={userNameFilter}
              onChange={(e) => {
                setUserNameFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">Session ID</label>
            <Input
              placeholder="Filter by session ID..."
              value={sessionIdFilter}
              onChange={(e) => {
                setSessionIdFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="min-w-[150px]">
            <label className="text-sm font-medium mb-1 block">Viewer Type</label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:bg-accent focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={viewerTypeFilter}
              onChange={(e) => {
                setViewerTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All</option>
              <option value="user">Logged In</option>
              <option value="guest">Guest</option>
            </select>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} size="sm">
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Table */}
        {filteredViews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No product views found
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead className="w-[200px]">User</TableHead>
                    <TableHead className="w-[200px]">Session ID</TableHead>
                    <TableHead className="w-[200px]">Viewed At</TableHead>
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredViews.map((view) => (
                    <TableRow key={view.id}>
                      <TableCell className="font-mono text-xs">
                        <span
                          className="truncate block max-w-[100px]"
                          title={view.id}
                        >
                          {truncateText(view.id, 15)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="truncate block max-w-[200px]"
                          title={view.user_name || "Guest"}
                        >
                          {view.user_name || (
                            <span className="text-muted-foreground">Guest</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="truncate block max-w-[200px] font-mono text-xs"
                          title={view.session_id || "—"}
                        >
                          {view.session_id
                            ? truncateText(view.session_id, 25)
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="truncate block max-w-[200px]"
                          title={formatViewedAtLong(view.viewed_at)}
                        >
                          {formatViewedAtLong(view.viewed_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <ProductViewDetailsDialog view={view} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing page {currentPage} of {totalPages} ({total} total
                  views)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
