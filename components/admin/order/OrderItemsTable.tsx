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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { CreateOrderItemDialog } from "./CreateOrderItemDialog"
import { EditOrderItemDialog } from "./EditOrderItemDialog"
import { DeleteOrderItemDialog } from "./DeleteOrderItemDialog"
import { formatPrice } from "@/lib/utils"
import type { OrderItem } from "@/types/order"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface OrderItemsTableProps {
  orderId: string
  items: OrderItem[]
}

const ITEMS_PER_PAGE = 10
const MAX_PAGES = 10

export function OrderItemsTable({ orderId, items }: OrderItemsTableProps) {
  const [productNameFilter, setProductNameFilter] = useState<string>("")
  const [colorFilter, setColorFilter] = useState<string>("all")
  const [sizeFilter, setSizeFilter] = useState<string>("all")
  const [materialFilter, setMaterialFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Get unique values for filter options
  const uniqueColors = useMemo(() => {
    const colors = items
      .map((item) => item.color_snapshot)
      .filter((color): color is string => Boolean(color))
    return Array.from(new Set(colors)).sort()
  }, [items])

  const uniqueSizes = useMemo(() => {
    const sizes = items
      .map((item) => item.size_snapshot)
      .filter((size): size is string => Boolean(size))
    return Array.from(new Set(sizes)).sort()
  }, [items])

  const uniqueMaterials = useMemo(() => {
    const materials = items
      .map((item) => item.material_snapshot)
      .filter((material): material is string => Boolean(material))
    return Array.from(new Set(materials)).sort()
  }, [items])

  // Filter items (on full items data)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesProductName = !productNameFilter || 
        (item.product_name_snapshot?.toLowerCase().includes(productNameFilter.toLowerCase()) ?? false)
      const matchesColor = colorFilter === "all" || item.color_snapshot === colorFilter
      const matchesSize = sizeFilter === "all" || item.size_snapshot === sizeFilter
      const matchesMaterial = materialFilter === "all" || item.material_snapshot === materialFilter
      
      return matchesProductName && matchesColor && matchesSize && matchesMaterial
    })
  }, [items, productNameFilter, colorFilter, sizeFilter, materialFilter])

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

  const handleFilterChange = () => {
    // Reset to page 1 when filters change
    setCurrentPage(1)
  }

  const hasActiveFilters = 
    productNameFilter !== "" || 
    colorFilter !== "all" || 
    sizeFilter !== "all" || 
    materialFilter !== "all"

  const clearFilters = () => {
    setProductNameFilter("")
    setColorFilter("all")
    setSizeFilter("all")
    setMaterialFilter("all")
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const calculateItemTotal = (item: OrderItem) => {
    const price = item.price_snapshot || 0
    return price * item.quantity
  }

  const calculateOrderTotal = () => {
    return filteredItems.reduce((total, item) => total + calculateItemTotal(item), 0)
  }

  const showingStart = paginatedItems.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0
  const showingEnd = (currentPage - 1) * ITEMS_PER_PAGE + paginatedItems.length
  const totalShowing = limitedFilteredItems.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Order Items</h3>
        <CreateOrderItemDialog orderId={orderId} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center w-full">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Product:</span>
            <Input
              placeholder="Search product..."
              value={productNameFilter}
              onChange={(e) => {
                setProductNameFilter(e.target.value)
                handleFilterChange()
              }}
              className="w-[180px]"
            />
          </div>

          {uniqueColors.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Color:</span>
              <Select
                value={colorFilter}
                onValueChange={(value) => {
                  setColorFilter(value)
                  handleFilterChange()
                }}
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
          )}

          {uniqueSizes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Size:</span>
              <Select
                value={sizeFilter}
                onValueChange={(value) => {
                  setSizeFilter(value)
                  handleFilterChange()
                }}
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
          )}

          {uniqueMaterials.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Material:</span>
              <Select
                value={materialFilter}
                onValueChange={(value) => {
                  setMaterialFilter(value)
                  handleFilterChange()
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Materials" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Materials</SelectItem>
                  {uniqueMaterials.map((material) => (
                    <SelectItem key={material} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 lg:px-3"
            >
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
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 10) {
                pageNum = i + 1
              } else if (currentPage <= 5) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 4) {
                pageNum = totalPages - 9 + i
              } else {
                pageNum = currentPage - 5 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              )
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {hasActiveFilters ? "No items match the filters" : "No items in this order"}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product_name_snapshot || "Unknown Product"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.color_snapshot || item.size_snapshot || item.material_snapshot
                        ? [
                            item.color_snapshot,
                            item.size_snapshot,
                            item.material_snapshot,
                          ]
                            .filter(Boolean)
                            .join(" / ")
                        : "—"}
                    </TableCell>
                    <TableCell>{formatPrice(item.price_snapshot || 0)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(calculateItemTotal(item))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <EditOrderItemDialog orderItem={item} />
                        <DeleteOrderItemDialog orderItem={item} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={5} className="text-right font-semibold">
                    Total ({filteredItems.length} items):
                  </TableCell>
                  <TableCell className="font-bold text-lg">
                    {formatPrice(calculateOrderTotal())}
                  </TableCell>
                </TableRow>
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
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 10) {
                pageNum = i + 1
              } else if (currentPage <= 5) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 4) {
                pageNum = totalPages - 9 + i
              } else {
                pageNum = currentPage - 5 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              )
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
      )}
    </div>
  )
}
