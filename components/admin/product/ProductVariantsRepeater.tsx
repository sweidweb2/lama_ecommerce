"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import { Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import {
  MAX_SERVER_ACTION_UPLOAD_BYTES,
  MAX_SERVER_ACTION_UPLOAD_LABEL,
} from "@/lib/constants/uploads";

export type VariantDraftRow = {
  key: string;
  color: string;
  size: string;
  material: string;
  quantity_stock: string;
  sku_variant: string;
  price_override: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
};

export type VariantFieldErrors = Partial<
  Record<
    | "color"
    | "size"
    | "material"
    | "quantity_stock"
    | "sku_variant"
    | "price_override",
    string
  >
>;

interface ProductVariantsRepeaterProps {
  variants: VariantDraftRow[];
  errorsByIndex: Record<number, VariantFieldErrors>;
  formError?: string;
  productPrice: number;
  disabled?: boolean;
  onChange: (variants: VariantDraftRow[]) => void;
}

function emptyVariant(): VariantDraftRow {
  return {
    key:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    color: "",
    size: "",
    material: "",
    quantity_stock: "0",
    sku_variant: "",
    price_override: "",
    imageFile: null,
    imagePreviewUrl: null,
  };
}

export function createEmptyVariantDraft(): VariantDraftRow {
  return emptyVariant();
}

export function ProductVariantsRepeater({
  variants,
  errorsByIndex,
  formError,
  productPrice,
  disabled = false,
  onChange,
}: ProductVariantsRepeaterProps) {
  const updateRow = (index: number, patch: Partial<VariantDraftRow>) => {
    if (disabled) return;
    onChange(
      variants.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const addRow = () => {
    if (disabled) return;
    onChange([...variants, emptyVariant()]);
  };

  const removeRow = (index: number) => {
    if (disabled || variants.length <= 1) return;
    const removed = variants[index];
    if (removed?.imagePreviewUrl) {
      URL.revokeObjectURL(removed.imagePreviewUrl);
    }
    onChange(variants.filter((_, i) => i !== index));
  };

  const setRowImage = (index: number, file: File | null) => {
    if (disabled) return;
    const current = variants[index];
    if (!current) return;
    if (current.imagePreviewUrl) {
      URL.revokeObjectURL(current.imagePreviewUrl);
    }
    updateRow(index, {
      imageFile: file,
      imagePreviewUrl: file ? URL.createObjectURL(file) : null,
    });
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Product Variants</h2>
          <p className="text-sm text-muted-foreground">
            Add at least one color / size / material combination. Customers need
            a variant to purchase.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={addRow} disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          Add variant
        </Button>
      </div>

      {formError && <p className="text-xs text-destructive">{formError}</p>}

      <div className="space-y-4">
        {variants.map((row, index) => {
          const rowErrors = errorsByIndex[index] ?? {};
          return (
            <div
              key={row.key}
              className="rounded-md border border-border/80 p-4 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Variant {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(index)}
                  disabled={disabled || variants.length <= 1}
                  aria-label={`Remove variant ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>
                    Color <span className="text-destructive">*</span>
                  </Label>
                  <ColorPicker
                    value={row.color}
                    onChange={(hex) => updateRow(index, { color: hex })}
                    className="w-full"
                    disabled={disabled}
                  />
                  {rowErrors.color && (
                    <p className="text-xs text-destructive">{rowErrors.color}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Size <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={row.size}
                    onChange={(e) =>
                      updateRow(index, { size: e.target.value.slice(0, 20) })
                    }
                    placeholder="e.g. M, 42, One Size"
                    maxLength={20}
                    disabled={disabled}
                  />
                  {rowErrors.size && (
                    <p className="text-xs text-destructive">{rowErrors.size}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Material <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={row.material}
                    onChange={(e) =>
                      updateRow(index, {
                        material: e.target.value.slice(0, 100),
                      })
                    }
                    placeholder="e.g. Cotton"
                    maxLength={100}
                    disabled={disabled}
                  />
                  {rowErrors.material && (
                    <p className="text-xs text-destructive">
                      {rowErrors.material}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>
                    Stock <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100000}
                    value={row.quantity_stock}
                    onChange={(e) =>
                      updateRow(index, { quantity_stock: e.target.value })
                    }
                    placeholder="0"
                    disabled={disabled}
                  />
                  {rowErrors.quantity_stock && (
                    <p className="text-xs text-destructive">
                      {rowErrors.quantity_stock}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>SKU Variant</Label>
                  <Input
                    value={row.sku_variant}
                    onChange={(e) =>
                      updateRow(index, {
                        sku_variant: e.target.value.slice(0, 255),
                      })
                    }
                    placeholder="Optional"
                    disabled={disabled}
                  />
                  {rowErrors.sku_variant && (
                    <p className="text-xs text-destructive">
                      {rowErrors.sku_variant}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Price Override</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={row.price_override}
                    onChange={(e) =>
                      updateRow(index, { price_override: e.target.value })
                    }
                    placeholder={
                      productPrice > 0
                        ? `Base: ${formatPrice(productPrice)}`
                        : "Optional"
                    }
                    disabled={disabled}
                  />
                  {rowErrors.price_override && (
                    <p className="text-xs text-destructive">
                      {rowErrors.price_override}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`variant-image-${row.key}`}>
                  Variant image
                </Label>
                <Input
                  id={`variant-image-${row.key}`}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  disabled={disabled}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file && file.size > MAX_SERVER_ACTION_UPLOAD_BYTES) {
                      e.target.value = "";
                      setRowImage(index, null);
                      toast.error(
                        `Image must be ${MAX_SERVER_ACTION_UPLOAD_LABEL} or smaller`,
                      );
                      return;
                    }
                    setRowImage(index, file);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Assigned to this variant and added to the product
                  gallery. Max {MAX_SERVER_ACTION_UPLOAD_LABEL} each; all images
                  in this form together must also stay under{" "}
                  {MAX_SERVER_ACTION_UPLOAD_LABEL}.
                </p>
                {row.imagePreviewUrl && (
                  <div className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted">
                    <Image
                      src={row.imagePreviewUrl}
                      alt={`Variant ${index + 1} preview`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                {row.imageFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => setRowImage(index, null)}
                  >
                    Clear image
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
