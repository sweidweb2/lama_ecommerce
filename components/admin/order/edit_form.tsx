"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit } from "lucide-react";
import { updateOrderAction } from "@/actions/order";
import { getAllowedOrderStatuses } from "@/lib/admin/order-status-transitions";
import type { OrderStatus, PaymentStatus, Order } from "@/types/order";
import { AdminFormDialog } from "@/components/admin/shared/admin-form-dialog";

const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "refunded",
];

export type AdminOrder = Order & {
  userName?: string;
};

type EditValues = {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
};

interface EditOrderDialogProps {
  order: AdminOrder;
  showText?: boolean;
  hasShipment?: boolean;
  onUpdated?: () => void | Promise<void>;
}

export function EditOrderDialog({
  order,
  showText = false,
  hasShipment = false,
  onUpdated,
}: EditOrderDialogProps) {
  const router = useRouter();
  const canSetShipped = order.status === "shipped" || hasShipment;
  const allowedStatuses = getAllowedOrderStatuses(order.status);

  const subtotalNum = order.subtotal || 0;
  const shippingFeeNum = order.shipping_fee || 0;
  const discountNum = order.discount || 0;
  const calculatedTotal = subtotalNum + shippingFeeNum - discountNum;

  return (
    <AdminFormDialog<EditValues>
      mode="edit"
      title="Edit Order"
      triggerLabel={`Edit order ${order.id}`}
      contentClassName="max-w-2xl max-h-[90vh] overflow-y-auto"
      initialValues={{
        status: order.status,
        paymentStatus: order.payment_status,
      }}
      submitLabel="Save Changes"
      toastMessages={{
        success: "Order updated",
        errorTitle: "Failed to update order",
      }}
      trigger={({ open }) => (
        <Button
          variant={showText ? "outline" : "ghost"}
          size={showText ? "default" : "icon"}
          onClick={open}
          aria-label={`Edit order ${order.id}`}
        >
          <Edit className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
          {showText && "Edit"}
        </Button>
      )}
      onSuccess={async () => {
        if (onUpdated) await onUpdated();
        router.refresh();
      }}
      onSubmit={async (values) => {
        if (values.status === "shipped" && !canSetShipped) {
          return {
            success: false,
            error:
              "Use Order Status on the order detail page to mark shipped (carrier + tracking).",
          };
        }

        const result = await updateOrderAction(order.id, {
          status: values.status,
          payment_status: values.paymentStatus,
          // shipping_fee, discount, phone, and email are not editable
          shipping_fee: order.shipping_fee ?? null,
          discount: order.discount ?? null,
          total: order.total ?? null,
        });

        if (!result.success) {
          return {
            success: false,
            error:
              result.error || "An error occurred while updating the order.",
          };
        }

        return { success: true };
      }}
    >
      {({ values, setValues, isSubmitting }) => (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`status-${order.id}`}>
                Order Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={values.status}
                onValueChange={(value) =>
                  setValues((prev) => ({
                    ...prev,
                    status: value as OrderStatus,
                  }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id={`status-${order.id}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      disabled={s === "shipped" && !canSetShipped}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!canSetShipped && (
                <p className="text-xs text-muted-foreground">
                  Use Order Status on the order detail page to mark shipped
                  (carrier + tracking).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`payment-status-${order.id}`}>
                Payment Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={values.paymentStatus}
                onValueChange={(value) =>
                  setValues((prev) => ({
                    ...prev,
                    paymentStatus: value as PaymentStatus,
                  }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id={`payment-status-${order.id}`}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Failed or refunded does not restore stock. Set status to
                cancelled to restock.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`shipping-fee-${order.id}`}>Shipping Fee</Label>
              <Input
                id={`shipping-fee-${order.id}`}
                type="number"
                step="0.01"
                min="0"
                value={order.shipping_fee?.toString() || ""}
                placeholder="0.00"
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`discount-${order.id}`}>Discount</Label>
              <Input
                id={`discount-${order.id}`}
                type="number"
                step="0.01"
                min="0"
                value={order.discount?.toString() || ""}
                placeholder="0.00"
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">${subtotalNum.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Shipping Fee:</span>
              <span className="font-medium">${shippingFeeNum.toFixed(2)}</span>
            </div>
            {discountNum > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Discount:</span>
                <span className="font-medium text-green-600">
                  -${discountNum.toFixed(2)}
                </span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="text-sm font-medium">Total:</span>
              <span className="text-lg font-bold">
                ${calculatedTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`phone-${order.id}`}>Phone</Label>
              <Input
                id={`phone-${order.id}`}
                type="tel"
                value={order.phone || ""}
                placeholder="+1234567890"
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`email-${order.id}`}>Email</Label>
              <Input
                id={`email-${order.id}`}
                type="email"
                value={order.email || ""}
                placeholder="customer@example.com"
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
