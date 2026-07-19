"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableWrapper } from "@/components/admin/table-wrapper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "@/components/ui/link";
import { Eye, X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useState, useMemo } from "react";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

type OrderWithEncryptedId = Order & { encryptedId?: string };

interface OrdersTableProps {
  orders: OrderWithEncryptedId[];
}

const orderStatusOptions: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All Statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Packed", value: "packed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Returned", value: "returned" },
  { label: "Cancelled", value: "cancelled" },
];

const paymentStatusOptions: { label: string; value: PaymentStatus | "all" }[] = [
  { label: "All Payments", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

const getOrderStatusClassName = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "packed":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
    case "delivered":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "returned":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getPaymentStatusVariant = (status: PaymentStatus) => {
  switch (status) {
    case "paid":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
      return "destructive";
    case "refunded":
      return "secondary";
    default:
      return "secondary";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatOrderId = (id: string) => {
  return id.substring(0, 8).toUpperCase();
};

const ORDERS_PER_PAGE = 25;
const MAX_PAGES = 40;

export function OrdersTable({ orders }: OrdersTableProps) {
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | "all">("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter first (on full orders data)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesOrderStatus =
        orderStatusFilter === "all" || order.status === orderStatusFilter;
      const matchesPaymentStatus =
        paymentStatusFilter === "all" || order.payment_status === paymentStatusFilter;
      return matchesOrderStatus && matchesPaymentStatus;
    });
  }, [orders, orderStatusFilter, paymentStatusFilter]);

  // Calculate pagination
  const maxOrdersToShow = MAX_PAGES * ORDERS_PER_PAGE;
  const limitedFilteredOrders = useMemo(() => {
    return filteredOrders.slice(0, maxOrdersToShow);
  }, [filteredOrders, maxOrdersToShow]);

  const totalFilteredOrders = filteredOrders.length;
  const totalPages = useMemo(() => {
    return Math.min(
      Math.ceil(limitedFilteredOrders.length / ORDERS_PER_PAGE),
      MAX_PAGES
    );
  }, [limitedFilteredOrders.length]);

  // Paginate the filtered results
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    const endIndex = startIndex + ORDERS_PER_PAGE;
    return limitedFilteredOrders.slice(startIndex, endIndex);
  }, [limitedFilteredOrders, currentPage]);

  // Reset to page 1 when filters change
  const handleFilterChange = (newFilter: OrderStatus | PaymentStatus | "all", type: "order" | "payment") => {
    if (type === "order") {
      setOrderStatusFilter(newFilter as OrderStatus | "all");
    } else {
      setPaymentStatusFilter(newFilter as PaymentStatus | "all");
    }
    setCurrentPage(1);
  };

  const hasActiveFilters = orderStatusFilter !== "all" || paymentStatusFilter !== "all";

  const clearFilters = () => {
    setOrderStatusFilter("all");
    setPaymentStatusFilter("all");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Order Status:
            </span>
            <Select
              value={orderStatusFilter}
              onValueChange={(value) =>
                handleFilterChange(value as OrderStatus | "all", "order")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {orderStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Payment Status:
            </span>
            <Select
              value={paymentStatusFilter}
              onValueChange={(value) =>
                handleFilterChange(value as PaymentStatus | "all", "payment")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                {paymentStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          Showing <span className="text-foreground font-medium">
            {paginatedOrders.length > 0 ? (currentPage - 1) * ORDERS_PER_PAGE + 1 : 0}
          </span>
          {" - "}
          <span className="text-foreground font-medium">
            {(currentPage - 1) * ORDERS_PER_PAGE + paginatedOrders.length}
          </span>
          {" of "}
          <span className="text-foreground font-medium">
            {totalFilteredOrders > maxOrdersToShow ? maxOrdersToShow : totalFilteredOrders}
          </span>
          {totalFilteredOrders > maxOrdersToShow && (
            <span className="text-muted-foreground"> (max {maxOrdersToShow} shown)</span>
          )}
          {" orders"}
        </div>
      </div>

      {/* Table */}
      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[15%]">Order ID</TableHead>
              <TableHead className="w-[15%]">Date</TableHead>
              <TableHead className="w-[12%]">Total</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[15%]">Payment</TableHead>
              <TableHead className="text-right w-auto min-w-[280px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {filteredOrders.length === 0
                    ? "No orders found matching the selected filters."
                    : "No orders on this page."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => {
                const formattedOrderId = formatOrderId(order.id);
                const formattedDate = formatDate(order.created_at);
                const totalLabel = `$${order.total?.toFixed(2) ?? "0.00"}`;
                const orderStatusLabel =
                  order.status.charAt(0).toUpperCase() + order.status.slice(1);
                const paymentStatusLabel =
                  order.payment_status.charAt(0).toUpperCase() +
                  order.payment_status.slice(1);

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium w-[15%]">
                      <span
                        className="block max-w-[120px] truncate"
                        title={order.id}
                      >
                        #{formattedOrderId}
                      </span>
                    </TableCell>
                    <TableCell className="w-[15%]">
                      <span
                        className="block max-w-[140px] truncate"
                        title={formattedDate}
                      >
                        {formattedDate}
                      </span>
                    </TableCell>
                    <TableCell className="w-[12%]">
                      <span
                        className="block max-w-[120px] truncate"
                        title={totalLabel}
                      >
                        {totalLabel}
                      </span>
                    </TableCell>
                    <TableCell className="w-[15%]">
                      <Badge
                        variant="outline"
                        className={`border-none px-2.5 py-0.5 text-xs font-medium rounded-full ${getOrderStatusClassName(order.status)}`}
                      >
                        <span
                          className="block max-w-[120px] truncate"
                          title={orderStatusLabel}
                        >
                          {orderStatusLabel}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[15%]">
                      <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                        <span
                          className="block max-w-[120px] truncate"
                          title={paymentStatusLabel}
                        >
                          {paymentStatusLabel}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right w-auto min-w-[280px]">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/order_details/${encodeURIComponent(order.encryptedId ?? order.id)}`}
                        >
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View Order
                          </Button>
                        </Link>
                        <Link href={`/orders/${order.id}/invoice`}>
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            View Invoice
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 flex-wrap justify-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-9"
                onClick={() => handlePageChange(page)}
                aria-label={`Go to page ${page}`}
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
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
