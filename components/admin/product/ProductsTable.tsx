'use client'

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { EditProductDialog, type AdminProduct } from "./edit_form"
import { DeleteProductDialog } from "./delete_dialog"
import { X, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import Link from "next/link"
import type { Brand, Category } from "@/types/product"

interface ProductsTableProps {
  products: AdminProduct[]
  brands: Brand[]
  categories: Category[]
}

const PRODUCTS_PER_PAGE = 25
const MAX_PAGES = 60

export function ProductsTable({ products, brands, categories }: ProductsTableProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [brandFilter, setBrandFilter] = useState<string>("all")
  const [featuredFilter, setFeaturedFilter] = useState<string>("all")
  const [trendingFilter, setTrendingFilter] = useState<string>("all")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Filter products (on full products data)
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter
      const matchesBrand = brandFilter === "all" || product.brand_id === brandFilter
      const matchesFeatured = featuredFilter === "all" || 
        (featuredFilter === "true" ? product.is_featured : !product.is_featured)
      const matchesTrending = trendingFilter === "all" || 
        (trendingFilter === "true" ? product.is_trending : !product.is_trending)
      const matchesActive = activeFilter === "all" || 
        (activeFilter === "true" ? product.is_active : !product.is_active)
      
      return matchesCategory && matchesBrand && matchesFeatured && matchesTrending && matchesActive
    })
  }, [products, categoryFilter, brandFilter, featuredFilter, trendingFilter, activeFilter])

  // Calculate pagination
  const maxProductsToShow = MAX_PAGES * PRODUCTS_PER_PAGE
  const limitedFilteredProducts = useMemo(() => {
    return filteredProducts.slice(0, maxProductsToShow)
  }, [filteredProducts, maxProductsToShow])

  const totalFilteredProducts = filteredProducts.length
  const totalPages = useMemo(() => {
    return Math.min(
      Math.ceil(limitedFilteredProducts.length / PRODUCTS_PER_PAGE),
      MAX_PAGES
    )
  }, [limitedFilteredProducts.length])

  // Paginate the filtered results
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
    const endIndex = startIndex + PRODUCTS_PER_PAGE
    return limitedFilteredProducts.slice(startIndex, endIndex)
  }, [limitedFilteredProducts, currentPage])

  const handleFilterChange = (value: string, type: "category" | "brand" | "featured" | "trending" | "active") => {
    switch (type) {
      case "category":
        setCategoryFilter(value)
        break
      case "brand":
        setBrandFilter(value)
        break
      case "featured":
        setFeaturedFilter(value)
        break
      case "trending":
        setTrendingFilter(value)
        break
      case "active":
        setActiveFilter(value)
        break
    }
    // Reset to page 1 when filters change
    setCurrentPage(1)
  }

  const hasActiveFilters = 
    categoryFilter !== "all" || 
    brandFilter !== "all" || 
    featuredFilter !== "all" || 
    trendingFilter !== "all" || 
    activeFilter !== "all"

  const clearFilters = () => {
    setCategoryFilter("all")
    setBrandFilter("all")
    setFeaturedFilter("all")
    setTrendingFilter("all")
    setActiveFilter("all")
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Category:</span>
            <Select
              value={categoryFilter}
              onValueChange={(value) => handleFilterChange(value, "category")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Brand:</span>
            <Select
              value={brandFilter}
              onValueChange={(value) => handleFilterChange(value, "brand")}
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
            <span className="text-sm text-muted-foreground whitespace-nowrap">Featured:</span>
            <Select
              value={featuredFilter}
              onValueChange={(value) => handleFilterChange(value, "featured")}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Featured</SelectItem>
                <SelectItem value="false">Not Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Trending:</span>
            <Select
              value={trendingFilter}
              onValueChange={(value) => handleFilterChange(value, "trending")}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Trending</SelectItem>
                <SelectItem value="false">Not Trending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
            <Select
              value={activeFilter}
              onValueChange={(value) => handleFilterChange(value, "active")}
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

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Pagination - Top */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className="w-9"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Table */}
      <TableWrapper>
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {filteredProducts.length === 0 
                    ? "No products found matching the selected filters."
                    : "No products on this page."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image ? (
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">IMG</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-[220px] truncate">
                    {product.name}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate">
                    ${product.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate">
                    {product.sku || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {product.is_featured && (
                        <Badge variant="outline">Featured</Badge>
                      )}
                      {product.is_trending && (
                        <Badge variant="outline">Trending</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/products/${product.id}`}>
                        <Button variant="ghost" size="icon" aria-label={`View ${product.name}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <EditProductDialog
                        product={product}
                        brands={brands}
                        categories={categories}
                      />
                      <DeleteProductDialog product={product} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className="w-9"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
