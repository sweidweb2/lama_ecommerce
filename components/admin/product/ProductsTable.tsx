'use client'

import { Fragment, useState, type KeyboardEvent, type MouseEvent } from "react"
import { useRouter } from "next/navigation"
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
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { EditProductDialog, type AdminProduct } from "./edit_form"
import { DeleteProductDialog } from "./delete_dialog"
import { AdminUrlPagination } from "./AdminUrlPagination"
import { ChevronRight, Eye } from "lucide-react"
import Link from "@/components/ui/link"
import { cn, formatPrice } from "@/lib/utils"
import { LOW_STOCK_MAX, LOW_STOCK_MIN } from "@/lib/admin/metric-definitions"
import type { Brand, Category, ProductVariant } from "@/types/product"

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      'a, button, input, select, textarea, [role="button"], [data-row-ignore-click]',
    ),
  )
}

type AdminProductRow = AdminProduct & {
  encryptedId?: string
  hasLowStock?: boolean
  hasOutOfStock?: boolean
  variants?: ProductVariant[]
}

interface ProductsTableProps {
  products: AdminProductRow[]
  brands: Brand[]
  categories: Category[]
  totalCount: number
  pageSize: number
  page: number
  isRefreshing?: boolean
  onNavigate?: (href: string) => void
}

function variantLabel(variant: ProductVariant): string {
  const parts = [variant.color, variant.size, variant.material].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : "Variant"
}

function stockBadge(quantity: number) {
  if (quantity <= 0) {
    return <Badge variant="destructive">Out of stock</Badge>
  }
  if (quantity >= LOW_STOCK_MIN && quantity <= LOW_STOCK_MAX) {
    return <Badge variant="outline">Low stock</Badge>
  }
  return <Badge variant="secondary">In stock</Badge>
}

export function ProductsTable({
  products,
  brands,
  categories,
  totalCount,
  pageSize,
  page,
  isRefreshing = false,
  onNavigate,
}: ProductsTableProps) {
  const router = useRouter()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1)
  const showingStart = products.length > 0 ? (page - 1) * pageSize + 1 : 0
  const showingEnd = (page - 1) * pageSize + products.length

  const setExpanded = (productId: string, open: boolean) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (open) {
        next.add(productId)
      } else {
        next.delete(productId)
      }
      return next
    })
  }

  const productDetailsHref = (product: AdminProductRow) =>
    `/admin/products/${product.encryptedId || product.id}`

  const handleProductRowClick = (
    event: MouseEvent<HTMLTableRowElement>,
    product: AdminProductRow,
  ) => {
    if (isInteractiveTarget(event.target)) return
    router.push(productDetailsHref(product))
  }

  const handleProductRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    product: AdminProductRow,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return
    if (isInteractiveTarget(event.target)) return
    event.preventDefault()
    router.push(productDetailsHref(product))
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="text-foreground font-medium">{showingStart}</span>
        {" - "}
        <span className="text-foreground font-medium">{showingEnd}</span>
        {" of "}
        <span className="text-foreground font-medium">{totalCount}</span>
        {" products"}
      </p>

      <AdminUrlPagination
        totalPages={totalPages}
        basePath="/admin/products"
        onNavigate={onNavigate}
      />

      <TableWrapper isRefreshing={isRefreshing}>
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
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
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products found matching the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const variants = product.variants ?? []
                const hasVariants = variants.length > 0
                const isExpanded = expandedIds.has(product.id)

                return (
                  <Fragment key={product.id}>
                    <TableRow
                      role="link"
                      tabIndex={0}
                      aria-label={`Open details for ${product.name}`}
                      className="cursor-pointer hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      onClick={(event) => handleProductRowClick(event, product)}
                      onKeyDown={(event) =>
                        handleProductRowKeyDown(event, product)
                      }
                    >
                      <TableCell className="w-10 px-2">
                        {hasVariants ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded
                                ? `Collapse variants for ${product.name}`
                                : `Expand variants for ${product.name}`
                            }
                            onClick={(event) => {
                              event.stopPropagation()
                              setExpanded(product.id, !isExpanded)
                            }}
                          >
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 transition-transform duration-200 ease-out",
                                isExpanded && "rotate-90",
                              )}
                            />
                          </Button>
                        ) : null}
                      </TableCell>
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
                      <TableCell className="font-medium max-w-[220px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{product.name}</span>
                          {hasVariants && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {variants.length} variant{variants.length === 1 ? "" : "s"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">
                        {formatPrice(product.price)}
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
                      <TableCell
                        className="text-right"
                        data-row-ignore-click
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex justify-end gap-2">
                          <Link href={productDetailsHref(product)}>
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

                    {hasVariants && (
                      <TableRow className="border-0 hover:bg-transparent">
                        <TableCell colSpan={7} className="p-0">
                          <Collapsible
                            open={isExpanded}
                            onOpenChange={(open) => setExpanded(product.id, open)}
                          >
                            <CollapsibleContent>
                              <table className="w-full table-fixed">
                                <tbody>
                                  {variants.map((variant) => (
                                    <tr
                                      key={variant.id}
                                      className="border-b bg-muted/40 last:border-b-0"
                                    >
                                      <td className="w-10 p-2" />
                                      <td className="p-2 align-middle">
                                        <div className="pl-2 text-xs text-muted-foreground">
                                          ↳
                                        </div>
                                      </td>
                                      <td className="p-2 align-middle max-w-[220px]">
                                        <div className="pl-2 flex items-center gap-2 min-w-0">
                                          {variant.color ? (
                                            <div
                                              className="w-3.5 h-3.5 rounded-full border border-border shrink-0"
                                              style={{
                                                backgroundColor: variant.color,
                                              }}
                                              title={variant.color}
                                            />
                                          ) : null}
                                          <span className="truncate text-sm text-muted-foreground">
                                            {variantLabel(variant)}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="p-2 align-middle max-w-[140px] truncate text-sm">
                                        {variant.price_override != null
                                          ? formatPrice(variant.price_override)
                                          : "—"}
                                      </td>
                                      <td className="p-2 align-middle max-w-[160px] truncate text-sm">
                                        {variant.sku_variant || "—"}
                                      </td>
                                      <td className="p-2 align-middle">
                                        <div className="flex flex-wrap items-center gap-1">
                                          {stockBadge(variant.quantity_stock)}
                                          <span
                                            className={
                                              variant.quantity_stock === 0
                                                ? "text-xs text-destructive"
                                                : "text-xs text-muted-foreground"
                                            }
                                          >
                                            qty {variant.quantity_stock}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="p-2" />
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </CollapsibleContent>
                          </Collapsible>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      <AdminUrlPagination
        totalPages={totalPages}
        basePath="/admin/products"
        onNavigate={onNavigate}
      />
    </div>
  )
}
