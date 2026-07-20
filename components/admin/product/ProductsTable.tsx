'use client'

import { useRouter, useSearchParams } from "next/navigation"
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
import { AdminPagination } from "./AdminPagination"
import { X, Eye } from "lucide-react"
import Link from "@/components/ui/link"
import type { Brand, Category } from "@/types/product"

type AdminProductRow = AdminProduct & {
  encryptedId?: string
  hasLowStock?: boolean
  hasOutOfStock?: boolean
}

interface ProductsTableProps {
  products: AdminProductRow[]
  brands: Brand[]
  categories: Category[]
  totalCount: number
  pageSize: number
  page: number
}

export function ProductsTable({
  products,
  brands,
  categories,
  totalCount,
  pageSize,
  page,
}: ProductsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const categoryFilter = searchParams.get("category") || "all"
  const brandFilter = searchParams.get("brand") || "all"
  const featuredFilter = searchParams.get("featured") || "all"
  const trendingFilter = searchParams.get("trending") || "all"
  const activeFilter = searchParams.get("active") || "all"
  const stockFilter = searchParams.get("stock") || "all"

  const setFilter = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete(name)
    } else {
      params.set(name, value)
    }
    params.delete("page")
    const query = params.toString()
    router.push(query ? `/admin/products?${query}` : "/admin/products")
  }

  const hasActiveFilters =
    categoryFilter !== "all" ||
    brandFilter !== "all" ||
    featuredFilter !== "all" ||
    trendingFilter !== "all" ||
    activeFilter !== "all" ||
    stockFilter !== "all"

  const clearFilters = () => {
    router.push("/admin/products")
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1)
  const showingStart = products.length > 0 ? (page - 1) * pageSize + 1 : 0
  const showingEnd = (page - 1) * pageSize + products.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Category:</span>
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
            <span className="text-sm text-muted-foreground whitespace-nowrap">Brand:</span>
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
            <span className="text-sm text-muted-foreground whitespace-nowrap">Featured:</span>
            <Select
              value={featuredFilter}
              onValueChange={(value) => setFilter("featured", value)}
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
              onValueChange={(value) => setFilter("trending", value)}
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
            <span className="text-sm text-muted-foreground whitespace-nowrap">Stock:</span>
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
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="text-foreground font-medium">{showingStart}</span>
        {" - "}
        <span className="text-foreground font-medium">{showingEnd}</span>
        {" of "}
        <span className="text-foreground font-medium">{totalCount}</span>
        {" products"}
      </p>

      <AdminPagination totalPages={totalPages} basePath="/admin/products" />

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
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No products found matching the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
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
                      <Link href={`/admin/products/${product.encryptedId || product.id}`}>
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

      <AdminPagination totalPages={totalPages} basePath="/admin/products" />
    </div>
  )
}
