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
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { AdminProductViewRow } from "@/repositories/product_view.repository";

interface ProductViewsTableProps {
  views: AdminProductViewRow[];
  currentPage: number;
  totalPages: number;
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
  fromDate: string,
  toDate: string,
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
    
    // Date filters
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      const viewed = new Date(view.viewed_at);
      if (viewed < from) return false;
    }
    
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      const viewed = new Date(view.viewed_at);
      if (viewed > to) return false;
    }
    
    return true;
  });
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
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");

  // Filter views
  const filteredViews = useMemo(
    () =>
      filterViews(
        views,
        productNameFilter,
        userNameFilter,
        viewerTypeFilter,
        fromDateFilter,
        toDateFilter
      ),
    [views, productNameFilter, userNameFilter, viewerTypeFilter, fromDateFilter, toDateFilter]
  );

  const hasActiveFilters =
    productNameFilter ||
    userNameFilter ||
    viewerTypeFilter !== "all" ||
    fromDateFilter ||
    toDateFilter;

  const clearFilters = () => {
    setProductNameFilter("");
    setUserNameFilter("");
    setViewerTypeFilter("all");
    setFromDateFilter("");
    setToDateFilter("");
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
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
        <div className="space-y-1">
          <Label htmlFor="filter-from-date">From Date</Label>
          <Input
            id="filter-from-date"
            type="date"
            value={fromDateFilter}
            onChange={(e) => setFromDateFilter(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-to-date">To Date</Label>
          <Input
            id="filter-to-date"
            type="date"
            value={toDateFilter}
            onChange={(e) => setToDateFilter(e.target.value)}
          />
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
              <TableHead>User</TableHead>
              <TableHead>Session ID</TableHead>
              <TableHead>Viewed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredViews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
