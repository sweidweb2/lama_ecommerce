'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit } from "lucide-react"
import type { ProductVariant } from "./VariantsTable"

interface EditVariantDialogProps {
  variant: ProductVariant
  productPrice: number
}

export function EditVariantDialog({ variant, productPrice }: EditVariantDialogProps) {
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState(variant.color || "")
  const [size, setSize] = useState(variant.size || "")
  const [material, setMaterial] = useState(variant.material || "")
  const [quantityStock, setQuantityStock] = useState(variant.quantity_stock.toString())
  const [skuVariant, setSkuVariant] = useState(variant.sku_variant || "")
  const [priceOverride, setPriceOverride] = useState(variant.price_override?.toString() || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // TODO: Wire this up to a real admin update action / API
    const updatedVariant = {
      ...variant,
      color: color || null,
      size: size || null,
      material: material || null,
      quantity_stock: parseInt(quantityStock) || 0,
      sku_variant: skuVariant || null,
      price_override: priceOverride ? parseFloat(priceOverride) : null,
    }

    console.log("Updating variant:", updatedVariant)
    setOpen(false)
  }

  const handleCancel = () => {
    // Reset to original values on cancel
    setColor(variant.color || "")
    setSize(variant.size || "")
    setMaterial(variant.material || "")
    setQuantityStock(variant.quantity_stock.toString())
    setSkuVariant(variant.sku_variant || "")
    setPriceOverride(variant.price_override?.toString() || "")
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Edit variant ${variant.id}`}
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product Variant</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`variant-color-${variant.id}`}>Color</Label>
                <Input
                  id={`variant-color-${variant.id}`}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g., Black, Red"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`variant-size-${variant.id}`}>Size</Label>
                <Input
                  id={`variant-size-${variant.id}`}
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g., S, M, L, XL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`variant-material-${variant.id}`}>Material</Label>
                <Input
                  id={`variant-material-${variant.id}`}
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g., Cotton, Polyester"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`variant-stock-${variant.id}`}>
                  Stock Quantity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`variant-stock-${variant.id}`}
                  type="number"
                  min="0"
                  value={quantityStock}
                  onChange={(e) => setQuantityStock(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`variant-sku-${variant.id}`}>SKU Variant</Label>
                <Input
                  id={`variant-sku-${variant.id}`}
                  value={skuVariant}
                  onChange={(e) => setSkuVariant(e.target.value)}
                  placeholder="Variant SKU"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`variant-price-${variant.id}`}>Price Override</Label>
              <Input
                id={`variant-price-${variant.id}`}
                type="number"
                step="0.01"
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
                placeholder={`Base price: ${productPrice.toFixed(2)}`}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use base product price ({productPrice.toFixed(2)})
              </p>
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
