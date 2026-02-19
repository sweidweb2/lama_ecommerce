'use client'

import { useState, useMemo, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { EditCartItemDialog, type CartItem } from "./EditCartItemDialog"
import { DeleteCartItemDialog } from "./DeleteCartItemDialog"
import { CreateCartItemDialog } from "./CreateCartItemDialog"
import { formatPrice } from "@/lib/utils"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

export type { CartItem }

interface CartItemsTableProps {
  cartId: string
  items: CartItem[]
  showHeader?: boolean
  isDeleted?: boolean
}

const ITEMS_PER_PAGE = 10
const MAX_PAGES = 10

export function CartItemsTable({ cartId, items, showHeader = true, isDeleted = false }: CartItemsTableProps) {
  const [productNameFilter, setProductNameFilter] = useState<string>("")
  const [variantFilter, setVariantFilter] = useState<string>("")
  const [minPriceFilter, setMinPriceFilter] = useState<string>("")
  const [maxPriceFilter, setMaxPriceFilter] = useState<string>("")
  const [minQuantityFilter, setMinQuantityFilter] = useState<string>("")
  const [maxQuantityFilter, setMaxQuantityFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)

  const calculateItemTotal = (item: CartItem) => {
    const price = item.price || 0
    return price * item.quantity
  }

  // Filter items (on full items data)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Product name filter
      const productName = item.product_name || "Unknown Product"
      const matchesProductName = !productNameFilter || 
        productName.toLowerCase().includes(productNameFilter.toLowerCase())

      // Variant filter (color, size, material)
      const variantText = item.color && item.size && item.material
        ? `${item.color} / ${item.size} / ${item.material}`
        : [item.color, item.size, item.material].filter(Boolean).join(" / ") || "—"
      const matchesVariant = !variantFilter || 
        variantText.toLowerCase().includes(variantFilter.toLowerCase())

      // Price filters
      const price = item.price || 0
      const minPrice = minPriceFilter ? parseFloat(minPriceFilter) : 0
      const maxPrice = maxPriceFilter ? parseFloat(maxPriceFilter) : Infinity
      const matchesPrice = price >= minPrice && price <= maxPrice

      // Quantity filters
      const quantity = item.quantity
      const minQuantity = minQuantityFilter ? parseInt(minQuantityFilter) : 0
      const maxQuantity = maxQuantityFilter ? parseInt(maxQuantityFilter) : Infinity
      const matchesQuantity = quantity >= minQuantity && quantity <= maxQuantity

      return matchesProductName && matchesVariant && matchesPrice && matchesQuantity
    })
  }, [items, productNameFilter, variantFilter, minPriceFilter, maxPriceFilter, minQuantityFilter, maxQuantityFilter])

  // Calculate pagination
  const maxItemsToShow = MAX_PAGES * ITEMS_PER_PAGE
  const limitedFilteredItems = useMemo(() => {
    return filteredItems.slice(0, maxItemsToShow)
  }, [filteredItems, maxItemsToShow])

  const totalFilteredItems = filteredItems.length
  const totalPages = useMemo(() => {
    return Math.min(
      Math.ceil(limitedFilteredItems.length / ITEMS_PER_PAGE),
      MAX_PAGES
    )
  }, [limitedFilteredItems.length])

  // Paginate the filtered results
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return limitedFilteredItems.slice(startIndex, endIndex)
  }, [limitedFilteredItems, currentPage])

  // Calculate totals for filtered items
  const calculateCartTotal = () => {
    return filteredItems.reduce((total, item) => total + calculateItemTotal(item), 0)
  }

  const hasActiveFilters = 
    productNameFilter !== "" ||
    variantFilter !== "" ||
    minPriceFilter !== "" ||
    maxPriceFilter !== "" ||
    minQuantityFilter !== "" ||
    maxQuantityFilter !== ""

  const clearFilters = () => {
    setProductNameFilter("")
    setVariantFilter("")
    setMinPriceFilter("")
    setMaxPriceFilter("")
    setMinQuantityFilter("")
    setMaxQuantityFilter("")
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [productNameFilter, variantFilter, minPriceFilter, maxPriceFilter, minQuantityFilter, maxQuantityFilter])

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cart Items</h3>
          <CreateCartItemDialog cartId={cartId} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Filters</h4>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Product Name Filter */}
          <div className="space-y-2">
            <Label htmlFor="product-name-filter" className="text-xs">Product Name</Label>
            <Input
              id="product-name-filter"
              placeholder="Search product..."
              value={productNameFilter}
              onChange={(e) => setProductNameFilter(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Variant Filter */}
          <div className="space-y-2">
            <Label htmlFor="variant-filter" className="text-xs">Variant (Color/Size/Material)</Label>
            <Input
              id="variant-filter"
              placeholder="Search variant..."
              value={variantFilter}
              onChange={(e) => setVariantFilter(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label className="text-xs">Price Range</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={minPriceFilter}
                onChange={(e) => setMinPriceFilter(e.target.value)}
                className="h-9"
                min="0"
                step="0.01"
              />
              <Input
                type="number"
                placeholder="Max"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(e.target.value)}
                className="h-9"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Quantity Range */}
          <div className="space-y-2">
            <Label className="text-xs">Quantity Range</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={minQuantityFilter}
                onChange={(e) => setMinQuantityFilter(e.target.value)}
                className="h-9"
                min="0"
              />
              <Input
                type="number"
                placeholder="Max"
                value={maxQuantityFilter}
                onChange={(e) => setMaxQuantityFilter(e.target.value)}
                className="h-9"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="text-xs text-muted-foreground">
          Showing {paginatedItems.length} of {totalFilteredItems} item{totalFilteredItems !== 1 ? 's' : ''}
          {hasActiveFilters && ` (filtered from ${items.length} total)`}
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

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Subtotal</TableHead>
              {!isDeleted && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isDeleted ? 5 : 6} className="text-center text-muted-foreground py-8">
                  {filteredItems.length === 0
                    ? items.length === 0
                      ? "No items in this cart"
                      : "No items found matching the selected filters."
                    : "No items on this page."}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium max-w-[200px]">
                      <div className="truncate" title={item.product_name || "Unknown Product"}>
                        {item.product_name || "Unknown Product"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                      <div className="truncate" title={item.color && item.size && item.material
                        ? `${item.color} / ${item.size} / ${item.material}`
                        : "—"}>
                        {item.color && item.size && item.material
                          ? `${item.color} / ${item.size} / ${item.material}`
                          : "—"}
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(item.price || 0)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(calculateItemTotal(item))}
                    </TableCell>
                    {!isDeleted && (
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <EditCartItemDialog cartItem={item} />
                          <DeleteCartItemDialog cartItem={item} />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {paginatedItems.length > 0 && (
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={4} className="text-right font-semibold">
                      {hasActiveFilters ? "Filtered Total:" : "Total:"}
                    </TableCell>
                    <TableCell colSpan={isDeleted ? 1 : 2} className="font-bold text-lg">
                      {formatPrice(calculateCartTotal())}
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      {/* Pagination - Bottom */}
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
    </div>
  )
}
