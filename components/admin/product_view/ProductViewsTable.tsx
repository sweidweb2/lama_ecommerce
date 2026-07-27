"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableWrapper } from "@/components/admin/table-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, X, TrendingUp } from "lucide-react";
import type { AdminProductViewRow } from "@/repositories/product_view.repository";

interface ProductViewsTableProps {
  views: AdminProductViewRow[];
  currentPage: number;
  totalPages: number;
}

interface ProductViewAggregate {
  product_id: string;
  product_name: string;
  view_count: number;
  unique_viewers: number;
  last_viewed_at: string;
  views: AdminProductViewRow[];
}

const MAX_CHARS = {
  id: 12,
  product_name: 30,
  user_name: 20,
  session_id: 20,
};

function truncateText(text: string | null, maxLength: number): string {
  if (!text) return "—";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return dateString;
  }
}

function filterViews(
  views: AdminProductViewRow[],
  productName: string,
  userName: string,
  viewerType: string,
): AdminProductViewRow[] {
  return views.filter((view) => {
    const pn = (productName || "").trim().toLowerCase();
    const un = (userName || "").trim().toLowerCase();
    
    // Product name filter
    if (pn && !view.product_name.toLowerCase().includes(pn)) return false;
    
    // User name filter
    if (un) {
      const viewUserName = view.user_name?.toLowerCase() || "";
      if (!viewUserName.includes(un) && !"guest".includes(un)) return false;
    }
    
    // Viewer type filter
    if (viewerType === "user" && !view.user_id) return false;
    if (viewerType === "guest" && view.user_id) return false;
    
    return true;
  });
}

function applyMarketingFilter(
  views: AdminProductViewRow[],
  marketingFilter: string,
): AdminProductViewRow[] {
  if (marketingFilter === "all" || !marketingFilter) {
    return views;
  }

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Filter by date range if needed
  let filteredViews = views;
  if (marketingFilter === "most_viewed_today" || marketingFilter === "least_viewed_today") {
    filteredViews = views.filter((view) => {
      const viewed = new Date(view.viewed_at);
      return viewed >= startOfToday;
    });
  } else if (marketingFilter === "most_viewed_week" || marketingFilter === "least_viewed_week") {
    filteredViews = views.filter((view) => {
      const viewed = new Date(view.viewed_at);
      return viewed >= startOfWeek;
    });
  } else if (marketingFilter === "most_viewed_month" || marketingFilter === "least_viewed_month") {
    filteredViews = views.filter((view) => {
      const viewed = new Date(view.viewed_at);
      return viewed >= startOfMonth;
    });
  }

  // Aggregate by product
  const productMap = new Map<string, ProductViewAggregate>();
  const productUniqueViewers = new Map<string, Set<string>>();

  filteredViews.forEach((view) => {
    const existing = productMap.get(view.product_id);
    
    if (existing) {
      existing.view_count++;
      existing.views.push(view);
      
      // Track unique viewers
      let uniqueSet = productUniqueViewers.get(view.product_id);
      if (!uniqueSet) {
        uniqueSet = new Set<string>();
        productUniqueViewers.set(view.product_id, uniqueSet);
      }
      
      if (view.user_id) {
        uniqueSet.add(`user_${view.user_id}`);
      } else if (view.session_id) {
        uniqueSet.add(`session_${view.session_id}`);
      }
      
      existing.unique_viewers = uniqueSet.size;
      
      // Update last viewed date if this is more recent
      const viewedDate = new Date(view.viewed_at);
      const lastViewed = new Date(existing.last_viewed_at);
      if (viewedDate > lastViewed) {
        existing.last_viewed_at = view.viewed_at;
      }
    } else {
      const uniqueSet = new Set<string>();
      if (view.user_id) {
        uniqueSet.add(`user_${view.user_id}`);
      } else if (view.session_id) {
        uniqueSet.add(`session_${view.session_id}`);
      }
      
      productUniqueViewers.set(view.product_id, uniqueSet);
      
      productMap.set(view.product_id, {
        product_id: view.product_id,
        product_name: view.product_name,
        view_count: 1,
        unique_viewers: uniqueSet.size,
        last_viewed_at: view.viewed_at,
        views: [view],
      });
    }
  });

  // Convert to array and sort
  const aggregated = Array.from(productMap.values());
  
  switch (marketingFilter) {
    case "most_viewed":
    case "most_viewed_today":
    case "most_viewed_week":
    case "most_viewed_month":
      aggregated.sort((a, b) => b.view_count - a.view_count);
      break;
    case "least_viewed":
    case "least_viewed_today":
    case "least_viewed_week":
    case "least_viewed_month":
      aggregated.sort((a, b) => a.view_count - b.view_count);
      break;
    case "most_unique_viewers":
      aggregated.sort((a, b) => b.unique_viewers - a.unique_viewers);
      break;
    case "recently_viewed":
      aggregated.sort((a, b) => {
        const dateA = new Date(a.last_viewed_at);
        const dateB = new Date(b.last_viewed_at);
        return dateB.getTime() - dateA.getTime();
      });
      break;
  }

  // Return all views for the top products (or all if not limiting)
  // For marketing filters, we'll show the aggregated view in a special format
  // For now, return the views from the top products
  const topProducts = aggregated.slice(0, 100); // Limit to top 100 products
  const result: AdminProductViewRow[] = [];
  
  topProducts.forEach((agg) => {
    result.push(...agg.views);
  });

  return result;
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 10) {
            pageNum = i + 1;
          } else if (currentPage <= 5) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 4) {
            pageNum = totalPages - 9 + i;
          } else {
            pageNum = currentPage - 5 + i;
          }
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              className="w-9"
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      <div className="text-sm text-muted-foreground ml-4">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}

export function ProductViewsTable({
  views,
  currentPage,
  totalPages,
}: ProductViewsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [productNameFilter, setProductNameFilter] = useState("");
  const [userNameFilter, setUserNameFilter] = useState("");
  const [viewerTypeFilter, setViewerTypeFilter] = useState("all");
  const [marketingFilter, setMarketingFilter] = useState("all");

  // First apply marketing filter, then apply other filters
  const marketingFilteredViews = useMemo(
    () => applyMarketingFilter(views, marketingFilter),
    [views, marketingFilter]
  );

  // Filter views
  const filteredViews = useMemo(
    () =>
      filterViews(
        marketingFilteredViews,
        productNameFilter,
        userNameFilter,
        viewerTypeFilter,
      ),
    [marketingFilteredViews, productNameFilter, userNameFilter, viewerTypeFilter]
  );

  // Calculate product view counts for display when marketing filter is active
  const productViewCounts = useMemo(() => {
    if (marketingFilter === "all") return new Map();
    
    const counts = new Map<string, number>();
    filteredViews.forEach((view) => {
      counts.set(view.product_id, (counts.get(view.product_id) || 0) + 1);
    });
    return counts;
  }, [filteredViews, marketingFilter]);

  const hasActiveFilters =
    productNameFilter ||
    userNameFilter ||
    viewerTypeFilter !== "all" ||
    marketingFilter !== "all";

  const clearFilters = () => {
    setProductNameFilter("");
    setUserNameFilter("");
    setViewerTypeFilter("all");
    setMarketingFilter("all");
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    router.push(`/admin/product-views?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-4">
        {/* Marketing Filters */}
        <div className="space-y-1">
          <Label htmlFor="filter-marketing" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Marketing Filter
          </Label>
          <Select value={marketingFilter} onValueChange={setMarketingFilter}>
            <SelectTrigger id="filter-marketing" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="most_viewed">Most Viewed Products</SelectItem>
              <SelectItem value="least_viewed">Least Viewed Products</SelectItem>
              <SelectItem value="most_viewed_today">Most Viewed Today</SelectItem>
              <SelectItem value="most_viewed_week">Most Viewed This Week</SelectItem>
              <SelectItem value="most_viewed_month">Most Viewed This Month</SelectItem>
              <SelectItem value="most_unique_viewers">Most Unique Viewers</SelectItem>
              <SelectItem value="recently_viewed">Recently Viewed Products</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Other Filters */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-end">
          <div className="space-y-1">
            <Label htmlFor="filter-product-name">Product Name</Label>
            <Input
              id="filter-product-name"
              placeholder="Search product..."
              value={productNameFilter}
              onChange={(e) => setProductNameFilter(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-user-name">User Name</Label>
            <Input
              id="filter-user-name"
              placeholder="Search user..."
              value={userNameFilter}
              onChange={(e) => setUserNameFilter(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-viewer-type">Viewer Type</Label>
            <Select value={viewerTypeFilter} onValueChange={setViewerTypeFilter}>
              <SelectTrigger id="filter-viewer-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="user">Logged In</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredViews.length} of {views.length} views
            {hasActiveFilters && " (filtered)"}
          </div>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      )}

      {/* Pagination - Top */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Product</TableHead>
              {marketingFilter !== "all" && (
                <TableHead className="text-center">View Count</TableHead>
              )}
              <TableHead>User</TableHead>
              <TableHead>Session ID</TableHead>
              <TableHead>Viewed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredViews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={marketingFilter !== "all" ? 6 : 5} className="text-center text-muted-foreground py-8">
                  {hasActiveFilters
                    ? "No product views found matching the filters."
                    : "No product views found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredViews.map((view) => (
                <TableRow key={view.id}>
                  <TableCell className="font-mono text-xs">
                    <div className="max-w-[120px] truncate" title={view.id}>
                      {truncateText(view.id, MAX_CHARS.id)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate" title={view.product_name}>
                      {truncateText(view.product_name, MAX_CHARS.product_name)}
                    </div>
                  </TableCell>
                  {marketingFilter !== "all" && (
                    <TableCell className="text-center font-medium">
                      {productViewCounts.get(view.product_id) || 0}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={view.user_name || "Guest"}>
                      {view.user_id
                        ? truncateText(view.user_name, MAX_CHARS.user_name)
                        : "Guest"}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <div className="max-w-[200px] truncate" title={view.session_id || "—"}>
                      {view.session_id
                        ? truncateText(view.session_id, MAX_CHARS.session_id)
                        : "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(view.viewed_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      {/* Pagination - Bottom (Centered) */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
