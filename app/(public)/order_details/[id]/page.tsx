import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { OrderBreadcrumbs } from "@/components/(public)/orders/OrderBreadcrumbs";
import type {
  Order,
  OrderItem,
  Payment,
  Shipment,
  OrderStatus,
  PaymentStatus,
} from "@/types/order";

export const metadata = {
  title: "Order Details | LAMA",
  description: "View detailed information about your order.",
};

// Dummy order data with all related information
const dummyOrder: Order = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  user_id: "550e8400-e29b-41d4-a716-446655440001",
  status: "delivered",
  subtotal: 299.99,
  shipping_fee: 15.0,
  discount: 30.0,
  total: 284.99,
  payment_status: "paid",
  address_snapshot: {
    country: "United States",
    city: "New York",
    address: "123 Main Street, Apt 4B",
    postal_code: "10001",
  },
  phone: "+1234567890",
  email: "john.doe@example.com",
  created_at: "2024-12-01T14:30:00Z",
  updated_at: "2024-12-05T10:00:00Z",
  deleted_at: null,
};

const dummyOrderItems: OrderItem[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440100",
    order_id: dummyOrder.id,
    customised_product_id: "550e8400-e29b-41d4-a716-446655440200",
    quantity: 2,
    price_snapshot: 89.99,
    product_name_snapshot: "Premium Cotton T-Shirt",
    size_snapshot: "Large",
    material_snapshot: "100% Organic Cotton",
    color_snapshot: "Navy Blue",
    created_at: "2024-12-01T14:30:00Z",
    deleted_at: null,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440101",
    order_id: dummyOrder.id,
    customised_product_id: "550e8400-e29b-41d4-a716-446655440201",
    quantity: 1,
    price_snapshot: 119.99,
    product_name_snapshot: "Classic Denim Jacket",
    size_snapshot: "Medium",
    material_snapshot: "100% Cotton Denim",
    color_snapshot: "Light Blue",
    created_at: "2024-12-01T14:30:00Z",
    deleted_at: null,
  },
];

const dummyPayment: Payment = {
  id: "550e8400-e29b-41d4-a716-446655440300",
  order_id: dummyOrder.id,
  status: "paid",
  transaction_id: "TXN-2024-12-01-001234",
  paid_at: "2024-12-01T14:35:00Z",
  amount: 284.99,
  currency: "USD",
  gateway: "stripe",
  payment_method: "Credit Card",
  payment_url: null,
  callback_payload: null,
  created_at: "2024-12-01T14:30:00Z",
  deleted_at: null,
};

const dummyShipment: Shipment = {
  id: "550e8400-e29b-41d4-a716-446655440400",
  order_id: dummyOrder.id,
  carrier_name: "DHL Express",
  tracking_number: "DHL1234567890",
  created_at: "2024-12-02T09:00:00Z",
  deleted_at: null,
};

const getOrderStatusVariant = (status: OrderStatus) => {
  switch (status) {
    case "delivered":
      return "default";
    case "shipped":
      return "default";
    case "processing":
      return "secondary";
    case "packed":
      return "secondary";
    case "pending":
      return "secondary";
    case "cancelled":
      return "destructive";
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
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number | null) => {
  if (!amount) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatOrderId = (id: string) => {
  return id.substring(0, 8).toUpperCase();
};

interface OrderDetailsPageProps {
  params: {
    id: string;
  };
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  // For now, all orders use the same dummy data
  // In production, this would fetch based on params.id

  const address = dummyOrder.address_snapshot as {
    country?: string;
    city?: string;
    address?: string;
    postal_code?: string;
  } | null;

  return (
    <div>
      {/* Breadcrumbs */}
      <OrderBreadcrumbs orderId={dummyOrder.id} />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Order Details
            </h1>
            <p className="text-muted-foreground mt-2">
              Order #{formatOrderId(dummyOrder.id)}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={getOrderStatusVariant(dummyOrder.status)}>
              {dummyOrder.status.charAt(0).toUpperCase() +
                dummyOrder.status.slice(1)}
            </Badge>
            <Badge variant={getPaymentStatusVariant(dummyOrder.payment_status)}>
              {dummyOrder.payment_status.charAt(0).toUpperCase() +
                dummyOrder.payment_status.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  {dummyOrderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.product_name_snapshot}
                      </TableCell>
                      <TableCell>{item.size_snapshot || "N/A"}</TableCell>
                      <TableCell>{item.color_snapshot || "N/A"}</TableCell>
                      <TableCell>{item.material_snapshot || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.price_snapshot)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(
                          (item.price_snapshot ?? 0) * item.quantity
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Payment Information */}
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
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge
                    variant={getPaymentStatusVariant(dummyPayment.status)}
                    className="mt-1"
                  >
                    {dummyPayment.status.charAt(0).toUpperCase() +
                      dummyPayment.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium mt-1">
                    {dummyPayment.payment_method || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-medium mt-1 font-mono text-sm">
                    {dummyPayment.transaction_id || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gateway</p>
                  <p className="font-medium mt-1 capitalize">
                    {dummyPayment.gateway || "N/A"}
                  </p>
                </div>
                {dummyPayment.paid_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Paid At</p>
                    <p className="font-medium mt-1">
                      {formatDate(dummyPayment.paid_at)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium mt-1">
                    {formatCurrency(dummyPayment.amount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Carrier</p>
                  <p className="font-medium mt-1">
                    {dummyShipment.carrier_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tracking Number</p>
                  <p className="font-medium mt-1 font-mono text-sm">
                    {dummyShipment.tracking_number || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shipped At</p>
                  <p className="font-medium mt-1">
                    {formatDate(dummyShipment.created_at)}
                  </p>
                </div>
              </div>
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
                    {formatCurrency(dummyOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {formatCurrency(dummyOrder.shipping_fee)}
                  </span>
                </div>
                {dummyOrder.discount && dummyOrder.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-green-600">
                      -{formatCurrency(dummyOrder.discount)}
                    </span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(dummyOrder.total)}
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
                    {address.city}, {address.postal_code}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.country}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No address provided</p>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dummyOrder.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dummyOrder.email}</span>
                </div>
              )}
              {dummyOrder.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dummyOrder.phone}</span>
                </div>
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
                  {formatDate(dummyOrder.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium text-sm mt-1">
                  {formatDate(dummyOrder.updated_at)}
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
