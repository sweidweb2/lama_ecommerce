"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import type { Brand, Category } from "@/types/product";

interface ProductsFiltersProps {
  brands: Brand[];
  categories: Category[];
  /** Soft-nav wrapper so the catalog can show an in-table loader while results load. */
  onNavigate?: (href: string) => void;
}

function selectValueOrAll(current: string, validIds: Set<string>): string {
  if (current === "all") return "all";
  return validIds.has(current) ? current : "all";
}

export function ProductsFilters({
  brands,
  categories,
  onNavigate,
}: ProductsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryIds = new Set(categories.map((c) => c.id));
  const brandIds = new Set(brands.map((b) => b.id));

  const categoryFilter = selectValueOrAll(
    searchParams.get("category") || "all",
    categoryIds,
  );
  const brandFilter = selectValueOrAll(
    searchParams.get("brand") || "all",
    brandIds,
  );
  const activeFilter = searchParams.get("active") || "all";
  const stockFilter = searchParams.get("stock") || "all";
  const featuredParam = searchParams.get("featured");
  const trendingParam = searchParams.get("trending");

  const navigate = (href: string) => {
    if (onNavigate) onNavigate(href);
    else router.push(href);
  };

  const setFilter = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    params.delete("page");
    // No dropdown for these; drop leftover URL params from stat-card deep links.
    params.delete("featured");
    params.delete("trending");
    // Display mode is client-only; never keep it in the URL.
    params.delete("view");
    const query = params.toString();
    navigate(query ? `/admin/products?${query}` : "/admin/products");
  };

  const hasActiveFilters =
    categoryFilter !== "all" ||
    brandFilter !== "all" ||
    activeFilter !== "all" ||
    stockFilter !== "all" ||
    featuredParam === "true" ||
    featuredParam === "false" ||
    trendingParam === "true" ||
    trendingParam === "false";

  const clearFilters = () => {
    navigate("/admin/products");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Category:
          </span>
          <Select
            value={categoryFilter}
            onValueChange={(value) => setFilter("category", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.is_active
                    ? category.name
                    : `${category.name} (inactive)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Brand:
          </span>
          <Select
            value={brandFilter}
            onValueChange={(value) => setFilter("brand", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Status:
          </span>
          <Select
            value={
              activeFilter === "true" || activeFilter === "false"
                ? activeFilter
                : "all"
            }
            onValueChange={(value) => setFilter("active", value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Stock:
          </span>
          <Select
            value={
              stockFilter === "low" || stockFilter === "out"
                ? stockFilter
                : "all"
            }
            onValueChange={(value) => setFilter("stock", value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="low">Low stock</SelectItem>
              <SelectItem value="out">Out of stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
