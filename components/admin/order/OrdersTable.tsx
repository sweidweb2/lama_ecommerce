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
import Link from "@/components/ui/link"
import { EditOrderDialog, type AdminOrder } from "./edit_form"
import { X, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { formatPrice, formatDate, truncateText } from "@/lib/utils"
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from "@/lib/constants/order-status"

const MAX_CHARS = {
  id: 10,
  user: 24,
} as const

export type { AdminOrder }

type AdminOrderRow = AdminOrder & { encryptedId?: string }

interface OrdersTableProps {
  orders: AdminOrderRow[]
  totalCount: number
  page: number
  pageSize: number
  statusFilter: string
  paymentStatusFilter: string
}

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

export function OrdersTable({
  orders,
  totalCount,
  page,
  pageSize,
  statusFilter,
  paymentStatusFilter,
}: OrdersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const getOrderHref = (order: AdminOrderRow) =>
    `/admin/orders/${order.encryptedId || order.id}`

  const openOrder = (order: AdminOrderRow) => {
    router.push(getOrderHref(order))
  }

  const pushQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all" || (key === "page" && value === "1")) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    const query = params.toString()
    router.push(query ? `/admin/orders?${query}` : "/admin/orders")
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const handleFilterChange = (
    value: string,
    type: "status" | "paymentStatus",
  ) => {
    if (type === "status") {
      pushQuery({ status: value, paymentStatus: paymentStatusFilter, page: "1" })
    } else {
      pushQuery({
        status: statusFilter,
        paymentStatus: value,
        page: "1",
      })
    }
  }

  const hasActiveFilters =
    statusFilter !== "all" || paymentStatusFilter !== "all"

  const clearFilters = () => {
    pushQuery({ status: null, paymentStatus: null, page: null })
  }

  const handlePageChange = (nextPage: number) => {
    pushQuery({
      status: statusFilter,
      paymentStatus: paymentStatusFilter,
      page: String(nextPage),
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
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
                <SelectItem value="fulfillment">In fulfillment</SelectItem>
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
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 10) {
                pageNum = i + 1
              } else if (page <= 5) {
                pageNum = i + 1
              } else if (page >= totalPages - 4) {
                pageNum = totalPages - 9 + i
              } else {
                pageNum = page - 5 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
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
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
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
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
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
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 10) {
                pageNum = i + 1
              } else if (page <= 5) {
                pageNum = i + 1
              } else if (page >= totalPages - 4) {
                pageNum = totalPages - 9 + i
              } else {
                pageNum = page - 5 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
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
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
