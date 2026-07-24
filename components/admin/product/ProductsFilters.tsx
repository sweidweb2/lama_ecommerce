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
}

export function ProductsFilters({ brands, categories }: ProductsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryFilter = searchParams.get("category") || "all";
  const brandFilter = searchParams.get("brand") || "all";
  const activeFilter = searchParams.get("active") || "all";
  const stockFilter = searchParams.get("stock") || "all";

  const setFilter = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    params.delete("page");
    // Drop legacy filters / display-only params.
    params.delete("featured");
    params.delete("trending");
    params.delete("view");
    const query = params.toString();
    router.push(query ? `/admin/products?${query}` : "/admin/products");
  };

  const hasActiveFilters =
    categoryFilter !== "all" ||
    brandFilter !== "all" ||
    activeFilter !== "all" ||
    stockFilter !== "all";

  const clearFilters = () => {
    router.push("/admin/products");
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
            value={activeFilter}
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
            value={stockFilter}
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
