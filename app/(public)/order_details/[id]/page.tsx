import Link from "@/components/ui/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  CreditCard,
  Truck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { OrderBreadcrumbs } from "@/components/(public)/orders/OrderBreadcrumbs";
import { getCurrentAuthUserFromComponent } from "@/repositories/auth.repository";
import { getOrderDetails } from "@/services/order.service";
import { getGuestSessionId } from "@/lib/auth/guest-session";
import { decryptOrderId } from "@/lib/utils/encryption";
import {
  formatOrderCurrency,
  formatShortOrderId,
  getOrderRestockMessage,
  getShipmentEmptyCopy,
  getShipmentEmptyKind,
  shouldShowOrderStatusBanner,
} from "@/lib/orders/order-display";
import type { OrderStatus, PaymentStatus } from "@/types/order";

export const metadata = {
  title: "Order Details",
  description: "View detailed information about your order.",
};

const getOrderStatusVariant = (status: OrderStatus) => {
  switch (status) {
    case "delivered":
    case "shipped":
      return "default";
    case "processing":
    case "packed":
    case "pending":
      return "secondary";
    case "cancelled":
    case "returned":
      return "destructive";
    default:
      return "secondary";
  }
};

const getPaymentStatusVariant = (status: PaymentStatus) => {
  switch (status) {
    case "paid":
      return "default";
    case "pending":
    case "refunded":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string; t?: string }>;
}

const ITEMS_PER_PAGE = 20;
const MAX_ITEM_PAGES = 20;

export default async function OrderDetailsPage({
  params,
  searchParams,
}: OrderDetailsPageProps) {
  const { id: encryptedOrRawId } = await params;
  const resolvedSearchParams = await searchParams;

  // Support encrypted IDs (post-checkout) and raw UUIDs (order list links)
  let orderId = encryptedOrRawId;
  try {
    orderId = decryptOrderId(decodeURIComponent(encryptedOrRawId));
  } catch {
    // Keep raw id from URL
  }

  // Determine identity — always pass guest session when present so auth users
  // can still open unclaimed guest orders via cookie fallback.
  const user = await getCurrentAuthUserFromComponent();
  const sessionId = await getGuestSessionId();
  const accessToken =
    typeof resolvedSearchParams?.t === "string"
      ? resolvedSearchParams.t
      : null;

  // Fetch order details with ownership check
  const details = await getOrderDetails(
    orderId,
    user?.id ?? null,
    sessionId,
    accessToken,
  );

  if (!details) {
    notFound();
  }

  const { order, items, payment, shipment, promo_code } = details;

  // Order items pagination (max 20 pages, 20 items per page)
  const maxItemsToShow = ITEMS_PER_PAGE * MAX_ITEM_PAGES;
  const limitedItems = items.slice(0, maxItemsToShow);
  const totalPages =
    limitedItems.length === 0
      ? 0
      : Math.min(
          Math.ceil(limitedItems.length / ITEMS_PER_PAGE),
          MAX_ITEM_PAGES,
        );

  const rawPage =
    typeof resolvedSearchParams?.page === "string"
      ? Number.parseInt(resolvedSearchParams.page, 10)
      : 1;
  const currentPage =
    !Number.isFinite(rawPage) || rawPage < 1
      ? 1
      : totalPages > 0
        ? Math.min(rawPage, totalPages)
        : 1;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems =
    totalPages === 0 ? [] : limitedItems.slice(startIndex, endIndex);

  const address = order.address_snapshot as {
    country?: string;
    city?: string;
    address?: string;
    postal_code?: string;
  } | null;

  const showStatusBanner = shouldShowOrderStatusBanner({
    status: order.status,
    payment_status: order.payment_status,
  });
  const restockMessage = showStatusBanner
    ? getOrderRestockMessage(order.stock_restored)
    : null;
  const shipmentEmpty = !shipment
    ? getShipmentEmptyCopy(getShipmentEmptyKind(order.status))
    : null;

  return (
    <div>
      {/* Breadcrumbs */}
      <OrderBreadcrumbs orderId={order.id} />

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">
                Order Details
              </h1>
              <p className="text-muted-foreground mt-2">
                Order #{formatShortOrderId(order.id)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getOrderStatusVariant(order.status)}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                {order.payment_status.charAt(0).toUpperCase() +
                  order.payment_status.slice(1)}
              </Badge>
              <Button asChild variant="outline" size="sm">
                <Link href={`/orders/${order.id}/invoice`}>View Invoice</Link>
              </Button>
            </div>
          </div>
          {showStatusBanner && (
            <div className="rounded-md border border-border/60 bg-muted/40 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">
                {order.status === "cancelled"
                  ? "This order was cancelled."
                  : order.payment_status === "refunded"
                    ? "Payment for this order was refunded."
                    : "Payment for this order failed."}
              </p>
              {restockMessage ? (
                <p className="mt-1 text-muted-foreground">{restockMessage}</p>
              ) : null}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paginatedItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No items found for this order.
                  </p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Color</TableHead>
                          <TableHead>Material</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedItems.map((item) => {
                          const productName = item.product_name_snapshot ?? "N/A";
                          const size = item.size_snapshot ?? "N/A";
                          const color = item.color_snapshot ?? "N/A";
                          const material = item.material_snapshot ?? "N/A";
                          const priceLabel = formatOrderCurrency(item.price_snapshot);
                          const subtotalLabel = formatOrderCurrency(
                            (item.price_snapshot ?? 0) * item.quantity,
                          );

                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                <span
                                  className="block max-w-[220px] truncate"
                                  title={productName}
                                >
                                  {productName}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span
                                  className="block max-w-[120px] truncate"
                                  title={size}
                                >
                                  {size}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span
                                  className="block max-w-[120px] truncate"
                                  title={color}
                                >
                                  {color}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span
                                  className="block max-w-[160px] truncate"
                                  title={material}
                                >
                                  {material}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span
                                  className="inline-block max-w-[80px] truncate text-right"
                                  title={String(item.quantity)}
                                >
                                  {item.quantity}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span
                                  className="inline-block max-w-[120px] truncate text-right"
                                  title={priceLabel}
                                >
                                  {priceLabel}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                <span
                                  className="inline-block max-w-[120px] truncate text-right"
                                  title={subtotalLabel}
                                >
                                  {subtotalLabel}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        {/* Previous page */}
                        <Link
                          href={
                            currentPage > 1
                              ? `?page=${currentPage - 1}`
                              : `?page=${currentPage}`
                          }
                          aria-disabled={currentPage <= 1}
                          className={`flex h-9 w-9 items-center justify-center rounded-md border text-xs transition-colors ${
                            currentPage <= 1
                              ? "cursor-not-allowed opacity-40"
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Link>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1 flex-wrap justify-center">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1,
                          ).map((page) => (
                            <Link
                              key={page}
                              href={`?page=${page}`}
                              aria-label={`Go to page ${page}`}
                              className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs transition-colors ${
                                currentPage === page
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "hover:bg-accent hover:text-accent-foreground"
                              }`}
                            >
                              {page}
                            </Link>
                          ))}
                        </div>

                        {/* Next page */}
                        <Link
                          href={
                            currentPage < totalPages
                              ? `?page=${currentPage + 1}`
                              : `?page=${currentPage}`
                          }
                          aria-disabled={currentPage >= totalPages}
                          className={`flex h-9 w-9 items-center justify-center rounded-md border text-xs transition-colors ${
                            currentPage >= totalPages
                              ? "cursor-not-allowed opacity-40"
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            {payment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Payment Status
                      </p>
                      <Badge
                        variant={getPaymentStatusVariant(payment.status)}
                        className="mt-1"
                      >
                        {payment.status.charAt(0).toUpperCase() +
                          payment.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Payment Method
                      </p>
                      <p className="font-medium mt-1">
                        {payment.payment_method || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Transaction ID
                      </p>
                      <p className="font-medium mt-1 font-mono text-sm">
                        {payment.transaction_id || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gateway</p>
                      <p className="font-medium mt-1 capitalize">
                        {payment.gateway || "N/A"}
                      </p>
                    </div>
                    {payment.paid_at && (
                      <div>
                        <p className="text-sm text-muted-foreground">Paid At</p>
                        <p className="font-medium mt-1">
                          {formatDate(payment.paid_at)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium mt-1">
                        {formatOrderCurrency(payment.amount)}
                      </p>
                    </div>
                  </div>
                  {payment.payment_url && payment.status === "pending" && (
                    <Button asChild className="w-full gap-2">
                      <a
                        href={payment.payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Pay now
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shipment ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Carrier</p>
                      <p className="font-medium mt-1">
                        {shipment.carrier_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tracking Number
                      </p>
                      <p className="font-medium mt-1 font-mono text-sm">
                        {shipment.tracking_number || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Shipped At
                      </p>
                      <p className="font-medium mt-1">
                        {formatDate(shipment.created_at)}
                      </p>
                    </div>
                  </div>
                ) : shipmentEmpty ? (
                  <div>
                    <p className="font-medium">{shipmentEmpty.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {shipmentEmpty.description}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formatOrderCurrency(order.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Shipping
                      {order.shipping_zone_name
                        ? ` (${order.shipping_zone_name})`
                        : ""}
                    </span>
                    <span className="font-medium">
                      {formatOrderCurrency(order.shipping_fee)}
                    </span>
                  </div>
                  {order.discount && order.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Discount
                        {promo_code ? ` (${promo_code})` : ""}
                      </span>
                      <span className="font-medium text-green-600">
                        -{formatOrderCurrency(order.discount)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg">
                      {formatOrderCurrency(order.total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {address ? (
                  <>
                    <p className="font-medium">{address.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}
                      {address.postal_code ? `, ${address.postal_code}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.country}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No address provided
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.email}</span>
                  </div>
                )}
                {order.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.phone}</span>
                  </div>
                )}
                {!order.email && !order.phone && (
                  <p className="text-sm text-muted-foreground">
                    No contact information provided
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Order Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Placed</p>
                  <p className="font-medium text-sm mt-1">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium text-sm mt-1">
                    {formatDate(order.updated_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
