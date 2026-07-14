'use client'

import { useState, useMemo } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableWrapper } from "@/components/admin/table-wrapper"
import Link from "@/components/ui/link"
import { EditOrderDialog, type AdminOrder } from "./edit_form"
import { X, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { formatPrice, formatDate, truncateText } from "@/lib/utils"
import type { OrderStatus, PaymentStatus } from "@/types/order"

const MAX_CHARS = {
  id: 10,
  user: 24,
} as const

export type { AdminOrder }

type AdminOrderRow = AdminOrder & { encryptedId?: string }

interface OrdersTableProps {
  orders: AdminOrderRow[]
}

const ORDERS_PER_PAGE = 20
const MAX_PAGES = 100

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'packed', 'shipped', 'delivered', 'returned', 'cancelled']
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded']

const getStatusVariant = (status: string) => {
  switch (status) {
    case "delivered":
    case "paid":
      return "default"
    case "pending":
    case "processing":
    case "packed":
      return "secondary"
    case "shipped":
      return "default"
    case "cancelled":
    case "failed":
      return "destructive"
    case "returned":
    case "refunded":
      return "outline"
    default:
      return "secondary"
  }
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  const getOrderHref = (order: AdminOrderRow) =>
    `/admin/orders/${order.encryptedId || order.id}`

  const openOrder = (order: AdminOrderRow) => {
    router.push(getOrderHref(order))
  }

  // Filter orders (on full orders data)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter
      const matchesPaymentStatus = paymentStatusFilter === "all" || order.payment_status === paymentStatusFilter
      
      return matchesStatus && matchesPaymentStatus
    })
  }, [orders, statusFilter, paymentStatusFilter])

  // Calculate pagination
  const maxOrdersToShow = MAX_PAGES * ORDERS_PER_PAGE
  const limitedFilteredOrders = useMemo(() => {
    return filteredOrders.slice(0, maxOrdersToShow)
  }, [filteredOrders, maxOrdersToShow])

  const totalPages = useMemo(() => {
    return Math.min(
      Math.max(1, Math.ceil(limitedFilteredOrders.length / ORDERS_PER_PAGE)),
      MAX_PAGES
    )
  }, [limitedFilteredOrders.length])

  // Paginate the filtered results
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE
    const endIndex = startIndex + ORDERS_PER_PAGE
    return limitedFilteredOrders.slice(startIndex, endIndex)
  }, [limitedFilteredOrders, currentPage])

  const handleFilterChange = (value: string, type: "status" | "paymentStatus") => {
    if (type === "status") {
      setStatusFilter(value)
    } else {
      setPaymentStatusFilter(value)
    }
    // Reset to page 1 when filters change
    setCurrentPage(1)
  }

  const hasActiveFilters = statusFilter !== "all" || paymentStatusFilter !== "all"

  const clearFilters = () => {
    setStatusFilter("all")
    setPaymentStatusFilter("all")
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
            <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
            <Select
              value={statusFilter}
              onValueChange={(value) => handleFilterChange(value, "status")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Payment:</span>
            <Select
              value={paymentStatusFilter}
              onValueChange={(value) => handleFilterChange(value, "paymentStatus")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Payment Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Statuses</SelectItem>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              <TableHead>Order ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => {
                const href = getOrderHref(order)
                const userLabel =
                  order.userName ||
                  (order.user_id ? `User ${order.user_id}` : "Guest")

                return (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openOrder(order)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        openOrder(order)
                      }
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={`View order ${order.id}`}
                  >
                    <TableCell className="font-medium font-mono text-xs">
                      <span title={order.id}>
                        {truncateText(order.id, MAX_CHARS.id)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className="block max-w-[160px] truncate"
                        title={userLabel}
                      >
                        {truncateText(userLabel, MAX_CHARS.user)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.payment_status)}>
                        {order.payment_status.charAt(0).toUpperCase() +
                          order.payment_status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.total ? formatPrice(order.total) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.created_at ? formatDate(order.created_at) : "—"}
                    </TableCell>
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Link href={href}>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`View order ${order.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <EditOrderDialog order={order} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
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
