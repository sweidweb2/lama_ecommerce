"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminFormDialog } from "@/components/admin/shared/admin-form-dialog";
import { createShippingZoneAction } from "@/actions/shipping";

export type AdminShippingZone = {
  id: string;
  name: string;
  estimated_time: string | null;
  fee: number | null;
  created_at?: string;
};

type CreateValues = {
  name: string;
  estimatedTime: string;
  fee: string;
};

interface CreateShippingZoneDialogProps {
  onCreated?: () => void;
}

const INITIAL: CreateValues = {
  name: "",
  estimatedTime: "",
  fee: "",
};

export function CreateShippingZoneDialog({
  onCreated,
}: CreateShippingZoneDialogProps) {
  return (
    <AdminFormDialog<CreateValues>
      mode="create"
      title="Create Shipping Zone"
      triggerLabel="Add Shipping Zone"
      contentClassName="max-w-xl"
      initialValues={INITIAL}
      submitLabel="Create Zone"
      toastMessages={{ success: "Shipping zone created" }}
      onSuccess={onCreated}
      onSubmit={async (values) => {
        const result = await createShippingZoneAction({
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
            <Label htmlFor="zone-name">
              Zone Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="zone-name"
              value={values.name}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., United States, Europe, Asia"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated-time">Estimated Delivery Time</Label>
            <Input
              id="estimated-time"
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
            <Label htmlFor="shipping-fee">
              Shipping Fee <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shipping-fee"
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
