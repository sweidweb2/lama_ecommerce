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
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { EditVariantDialog } from "./EditVariantDialog"
import { DeleteVariantDialog } from "./DeleteVariantDialog"

export interface ProductVariant {
  id: string
  product_id: string
  color: string | null
  size: string | null
  material: string | null
  quantity_stock: number
  sku_variant: string | null
  price_override: number | null
  created_at: string
  deleted_at: string | null
}

interface VariantsTableProps {
  variants: ProductVariant[]
  productPrice: number
}

const VARIANTS_PER_PAGE = 20
const MAX_PAGES = 30

export function VariantsTable({ variants, productPrice }: VariantsTableProps) {
  const [colorFilter, setColorFilter] = useState<string>("all")
  const [sizeFilter, setSizeFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Get unique values for filters
  const uniqueColors = useMemo(() => {
    const colors = variants.map(v => v.color).filter(Boolean) as string[]
    return Array.from(new Set(colors)).sort()
  }, [variants])

  const uniqueSizes = useMemo(() => {
    const sizes = variants.map(v => v.size).filter(Boolean) as string[]
    return Array.from(new Set(sizes)).sort()
  }, [variants])

  // Filter variants (on full variants data)
  const filteredVariants = useMemo(() => {
    return variants.filter((variant) => {
      const matchesColor = colorFilter === "all" || variant.color === colorFilter
      const matchesSize = sizeFilter === "all" || variant.size === sizeFilter
      const matchesStock = stockFilter === "all" || 
        (stockFilter === "in_stock" ? variant.quantity_stock > 0 : variant.quantity_stock === 0)
      
      return matchesColor && matchesSize && matchesStock
    })
  }, [variants, colorFilter, sizeFilter, stockFilter])

  // Calculate pagination
  const maxVariantsToShow = MAX_PAGES * VARIANTS_PER_PAGE
  const limitedFilteredVariants = useMemo(() => {
    return filteredVariants.slice(0, maxVariantsToShow)
  }, [filteredVariants, maxVariantsToShow])

  const totalFilteredVariants = filteredVariants.length
  const totalPages = useMemo(() => {
    return Math.min(
      Math.ceil(limitedFilteredVariants.length / VARIANTS_PER_PAGE),
      MAX_PAGES
    )
  }, [limitedFilteredVariants.length])

  // Paginate the filtered results
  const paginatedVariants = useMemo(() => {
    const startIndex = (currentPage - 1) * VARIANTS_PER_PAGE
    const endIndex = startIndex + VARIANTS_PER_PAGE
    return limitedFilteredVariants.slice(startIndex, endIndex)
  }, [limitedFilteredVariants, currentPage])

  const handleFilterChange = (value: string, type: "color" | "size" | "stock") => {
    switch (type) {
      case "color":
        setColorFilter(value)
        break
      case "size":
        setSizeFilter(value)
        break
      case "stock":
        setStockFilter(value)
        break
    }
    setCurrentPage(1)
  }

  const hasActiveFilters = colorFilter !== "all" || sizeFilter !== "all" || stockFilter !== "all"

  const clearFilters = () => {
    setColorFilter("all")
    setSizeFilter("all")
    setStockFilter("all")
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (variants.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No product variants available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Color:</span>
            <Select
              value={colorFilter}
              onValueChange={(value) => handleFilterChange(value, "color")}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Colors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colors</SelectItem>
                {uniqueColors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Size:</span>
            <Select
              value={sizeFilter}
              onValueChange={(value) => handleFilterChange(value, "size")}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Sizes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                {uniqueSizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Stock:</span>
            <Select
              value={stockFilter}
              onValueChange={(value) => handleFilterChange(value, "stock")}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Color</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>SKU Variant</TableHead>
              <TableHead>Price Override</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVariants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {filteredVariants.length === 0
                    ? "No variants found matching the selected filters."
                    : "No variants on this page."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedVariants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell>{variant.color || "—"}</TableCell>
                  <TableCell>{variant.size || "—"}</TableCell>
                  <TableCell>{variant.material || "—"}</TableCell>
                  <TableCell>
                    <span className={variant.quantity_stock === 0 ? "text-destructive" : ""}>
                      {variant.quantity_stock}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {variant.sku_variant || "—"}
                  </TableCell>
                  <TableCell>
                    {variant.price_override ? (
                      <span className="font-semibold">{formatPrice(variant.price_override)}</span>
                    ) : (
                      <span className="text-muted-foreground">{formatPrice(productPrice)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <EditVariantDialog variant={variant} productPrice={productPrice} />
                      <DeleteVariantDialog variant={variant} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      {/* Pagination - Bottom */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
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
