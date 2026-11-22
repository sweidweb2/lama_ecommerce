"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminFormDialog } from "@/components/admin/shared/admin-form-dialog";
import { updateShippingZoneAction } from "@/actions/shipping";
import type { AdminShippingZone } from "./create_form";

type EditValues = {
  name: string;
  estimatedTime: string;
  fee: string;
};

interface EditShippingZoneDialogProps {
  zone: AdminShippingZone;
  onUpdated?: () => void;
}

export function EditShippingZoneDialog({
  zone,
  onUpdated,
}: EditShippingZoneDialogProps) {
  return (
    <AdminFormDialog<EditValues>
      mode="edit"
      title="Edit Shipping Zone"
      triggerLabel={`Edit shipping zone ${zone.name}`}
      contentClassName="max-w-xl"
      initialValues={{
        name: zone.name,
        estimatedTime: zone.estimated_time || "",
        fee: zone.fee?.toString() || "",
      }}
      submitLabel="Save Changes"
      toastMessages={{
        success: "Shipping zone updated",
        errorTitle: "Failed to update shipping zone",
      }}
      onSuccess={onUpdated}
      onSubmit={async (values) => {
        const result = await updateShippingZoneAction({
          id: zone.id,
          name: values.name.trim(),
          estimated_time: values.estimatedTime.trim() || null,
          fee: values.fee ? parseFloat(values.fee) : null,
        });
        if (!result.success) {
          return { success: false, error: result.error };
        }
        return { success: true };
      }}
    >
      {({ values, setValues }) => (
        <>
          <div className="space-y-2">
            <Label htmlFor={`zone-name-${zone.id}`}>
              Zone Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`zone-name-${zone.id}`}
              value={values.name}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., United States, Europe, Asia"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`estimated-time-${zone.id}`}>
              Estimated Delivery Time
            </Label>
            <Input
              id={`estimated-time-${zone.id}`}
              value={values.estimatedTime}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  estimatedTime: e.target.value,
                }))
              }
              placeholder="e.g., 5-7 business days, 2-3 weeks"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`shipping-fee-${zone.id}`}>
              Shipping Fee <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`shipping-fee-${zone.id}`}
              type="number"
              step="0.01"
              min="0"
              value={values.fee}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, fee: e.target.value }))
              }
              placeholder="0.00"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the shipping fee for this zone
            </p>
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
