import type { OrderStatus, PaymentStatus } from "@/types/order";

/**
 * Whether the order details page should show a cancel/fail/refund status banner.
 */
export function shouldShowOrderStatusBanner(params: {
  status: OrderStatus;
  payment_status: PaymentStatus;
}): boolean {
  return (
    params.status === "cancelled" ||
    params.payment_status === "failed" ||
    params.payment_status === "refunded"
  );
}

/**
 * Restock copy when the status banner applies. Null when we should not claim restock.
 */
export function getOrderRestockMessage(stockRestored: boolean | undefined): string | null {
  if (stockRestored === true) {
    return "Inventory for this order was restored.";
  }
  return null;
}

export type ShipmentEmptyKind =
  | "awaiting"
  | "missing_tracking"
  | "not_shipped";

/**
 * When there is no shipment row, classify empty-state copy by order status.
 */
export function getShipmentEmptyKind(status: OrderStatus): ShipmentEmptyKind {
  if (status === "pending" || status === "processing" || status === "packed") {
    return "awaiting";
  }
  if (status === "shipped" || status === "delivered") {
    return "missing_tracking";
  }
  return "not_shipped";
}

export function getShipmentEmptyCopy(kind: ShipmentEmptyKind): {
  title: string;
  description: string;
} {
  switch (kind) {
    case "awaiting":
      return {
        title: "Not shipped yet",
        description:
          "Tracking details will appear here after your order ships.",
      };
    case "missing_tracking":
      return {
        title: "Tracking unavailable",
        description:
          "This order is marked as shipped, but tracking details are not available yet.",
      };
    case "not_shipped":
      return {
        title: "Not shipped",
        description: "This order did not ship.",
      };
  }
}

export function formatOrderCurrency(amount: number | null | undefined): string {
  if (amount == null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatShortOrderId(id: string): string {
  return id.substring(0, 8).toUpperCase();
}
