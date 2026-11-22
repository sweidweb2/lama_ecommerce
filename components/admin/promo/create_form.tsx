"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminFormDialog } from "@/components/admin/shared/admin-form-dialog";
import { createPromoCodeAction } from "@/actions/promo";
import { toast } from "sonner";

export type AdminPromoCode = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number | null;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  is_active: boolean;
  created_at?: string;
};

interface CreatePromoCodeDialogProps {
  onCreated?: () => void;
}

type CreateValues = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  expiresAt: string;
  maxUses: string;
  isActive: boolean;
};

const INITIAL: CreateValues = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  expiresAt: "",
  maxUses: "",
  isActive: true,
};

const getMinExpiresAt = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
};

export function CreatePromoCodeDialog({ onCreated }: CreatePromoCodeDialogProps) {
  return (
    <AdminFormDialog<CreateValues>
      mode="create"
      title="Create Promo Code"
      triggerLabel="Create Promo Code"
      contentClassName="max-w-xl max-h-[90vh] overflow-y-auto"
      initialValues={INITIAL}
      submitLabel="Create Promo Code"
      toastMessages={{
        success: "Promo code created",
        errorTitle: "Failed to create promo code",
      }}
      onSuccess={onCreated}
      onSubmit={async (values) => {
        // Validate expiration date
        if (values.expiresAt.trim() && new Date(values.expiresAt) <= new Date()) {
          return { success: false, error: "Expiration date cannot be in the past" };
        }

        // Validate discount value based on type
        const discountValueNum = values.discountValue
          ? parseFloat(values.discountValue)
          : null;
        if (discountValueNum === null || isNaN(discountValueNum)) {
          return { success: false, error: "Please enter a valid discount value" };
        }

        if (values.discountType === "percentage") {
          if (discountValueNum < 0) {
            return {
              success: false,
              error: "Percentage discount cannot be less than 0%",
            };
          }
          if (discountValueNum > 100) {
            return {
              success: false,
              error: "Percentage discount cannot be greater than 100%",
            };
          }
        } else if (values.discountType === "fixed") {
          if (discountValueNum < 0) {
            return {
              success: false,
              error: "Fixed discount cannot be less than $0",
            };
          }
        }

        const result = await createPromoCodeAction({
          code: values.code.trim().toUpperCase(),
          discount_type: values.discountType,
          discount_value: values.discountValue
            ? parseFloat(values.discountValue)
            : null,
          expires_at: values.expiresAt || null,
          max_uses: values.maxUses ? parseInt(values.maxUses, 10) : null,
          is_active: values.isActive,
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
            <Label htmlFor="promo-code">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="promo-code"
              value={values.code}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  code: e.target.value.toUpperCase(),
                }))
              }
              placeholder="SAVE20"
              required
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Enter a unique promotional code (will be converted to uppercase)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount-type">
                Discount Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={values.discountType}
                onValueChange={(value) =>
                  setValues((prev) => ({
                    ...prev,
                    discountType: value as "percentage" | "fixed",
                  }))
                }
              >
                <SelectTrigger id="discount-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-value">
                Discount Value <span className="text-destructive">*</span>
              </Label>
              <Input
                id="discount-value"
                type="number"
                step="0.01"
                min="0"
                max={values.discountType === "percentage" ? "100" : undefined}
                value={values.discountValue}
                onChange={(e) => {
                  const value = e.target.value;
                  // Prevent entering values greater than 100 for percentage
                  if (values.discountType === "percentage" && value !== "") {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue > 100) {
                      toast.error("Percentage cannot exceed 100%");
                      return;
                    }
                  }
                  setValues((prev) => ({ ...prev, discountValue: value }));
                }}
                placeholder={values.discountType === "percentage" ? "20" : "10.00"}
                required
              />
              <p className="text-xs text-muted-foreground">
                {values.discountType === "percentage"
                  ? "Enter percentage between 0 and 100 (e.g., 20 for 20%)"
                  : "Enter fixed amount in dollars"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expires-at">Expiration Date</Label>
              <Input
                id="expires-at"
                type="datetime-local"
                min={getMinExpiresAt()}
                value={values.expiresAt}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, expiresAt: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for no expiration. Cannot be in the past.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-uses">Max Uses</Label>
              <Input
                id="max-uses"
                type="number"
                min="1"
                value={values.maxUses}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, maxUses: e.target.value }))
                }
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of times this code can be used (leave empty for unlimited)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-active"
                checked={values.isActive}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, isActive: e.target.checked }))
                }
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="is-active" className="cursor-pointer">
                Active
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Inactive promo codes cannot be used by customers
            </p>
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}
