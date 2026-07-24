'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { updateProductVariantAction } from "@/actions/product"
import { z } from "zod"
import { updateProductVariantSchema } from "@/lib/validators/product_variant/update"
import { COLOR_PALETTE } from "@/lib/constants/color-palette"
import { ChromePicker } from "react-color"
import { toast } from "sonner"
import type { ProductVariant } from "./VariantsTable"

interface EditVariantDialogProps {
  variant: ProductVariant
  productPrice: number
}

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47']
const NUMERIC_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46']
const ALPHABETIC_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

export function EditVariantDialog({ variant, productPrice }: EditVariantDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [colorHex, setColorHex] = useState<string>("")
  const [customColorHex, setCustomColorHex] = useState<string>("")
  const [size, setSize] = useState<string>("")
  const [customSize, setCustomSize] = useState("")
  const [material, setMaterial] = useState("")
  const [quantityStock, setQuantityStock] = useState("")
  const [skuVariant, setSkuVariant] = useState("")
  const [priceOverride, setPriceOverride] = useState("")
  const [errors, setErrors] = useState<Partial<Record<keyof z.input<typeof updateProductVariantSchema>, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)

  // Initialize form with variant data
  useEffect(() => {
    if (open) {
      const paletteMatch = COLOR_PALETTE.find(
        (c) =>
          c.hex.toUpperCase() === variant.color?.toUpperCase() ||
          c.name.toLowerCase() === variant.color?.toLowerCase(),
      )
      if (paletteMatch) {
        setColorHex(paletteMatch.hex)
        setCustomColorHex("")
      } else if (variant.color) {
        setCustomColorHex(variant.color)
        setColorHex("")
      } else {
        setColorHex("")
        setCustomColorHex("")
      }

      const allSizes = [...CLOTHING_SIZES, ...SHOE_SIZES, ...NUMERIC_SIZES, ...ALPHABETIC_SIZES]
      if (variant.size && allSizes.includes(variant.size)) {
        setSize(variant.size)
        setCustomSize("")
      } else {
        setSize("")
        setCustomSize(variant.size || "")
      }

      setMaterial(variant.material || "")
      setQuantityStock(variant.quantity_stock.toString())
      setSkuVariant(variant.sku_variant || "")
      setPriceOverride(variant.price_override?.toString() || "")
      setErrors({})
      setFormError(null)
    }
  }, [open, variant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setFormError(null)

    const finalSize = customSize.trim() || size || null
    const trimmedMaterial = material.trim() || null
    const trimmedSkuVariant = skuVariant.trim() || null
    const finalColor = customColorHex || colorHex || null

    const candidate: z.input<typeof updateProductVariantSchema> = {
      product_id: variant.product_id,
      color: finalColor,
      size: finalSize,
      material: trimmedMaterial,
      quantity_stock: quantityStock.trim() === "" ? 0 : Number(quantityStock),
      sku_variant: trimmedSkuVariant,
      price_override: priceOverride.trim() === "" ? null : Number(priceOverride),
    }

    const parsed = updateProductVariantSchema.safeParse(candidate)

    if (!parsed.success) {
      const fieldErrors: Partial<
        Record<keyof z.input<typeof updateProductVariantSchema>, string>
      > = {}

      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof z.input<typeof updateProductVariantSchema>
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message
        }
      }

      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set("variant_id", variant.id)
      formData.set("product_id", variant.product_id)
      formData.set("color", parsed.data.color ?? "")
      formData.set("size", parsed.data.size ?? "")
      formData.set("material", parsed.data.material ?? "")
      formData.set(
        "quantity_stock",
        (parsed.data.quantity_stock ?? 0).toString(),
      )
      formData.set("sku_variant", parsed.data.sku_variant ?? "")
      formData.set(
        "price_override",
        parsed.data.price_override?.toString() ?? "",
      )

      const result = await updateProductVariantAction(formData)

      if (!result.success) {
        setFormError(result.error)
        if (result.error.toLowerCase().includes("stock")) {
          setErrors({ quantity_stock: result.error })
        }
        toast.error(result.error)
        return
      }

      toast.success("Variant updated")
      router.refresh()
      setOpen(false)
    } catch (error) {
      console.error("Error updating variant:", error)
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update variant. Please try again."
      setFormError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setOpen(false)
  }

  const handleSizeSelect = (selectedSize: string) => {
    setSize(selectedSize === size ? "" : selectedSize)
    if (selectedSize !== size) {
      setCustomSize("")
    }
  }

  const handleCustomSizeChange = (value: string) => {
    setCustomSize(value)
    if (value) {
      setSize("")
    }
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product Variant</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {COLOR_PALETTE.map((colorOption) => (
                  <button
                    key={colorOption.hex}
                    type="button"
                    onClick={() => {
                      setColorHex(colorHex === colorOption.hex ? "" : colorOption.hex)
                      setCustomColorHex("")
                    }}
                    className={`
                      relative h-8 w-8 rounded-full border-2 transition-all shrink-0
                      ${colorHex === colorOption.hex && !customColorHex
                        ? 'border-primary ring-2 ring-primary ring-offset-1 scale-110' 
                        : 'border-border hover:border-primary/50 hover:scale-105'}
                    `}
                    style={{ backgroundColor: colorOption.hex }}
                    aria-label={colorOption.name}
                    title={`${colorOption.name} (${colorOption.hex})`}
                  >
                    {colorHex === colorOption.hex && !customColorHex && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white shadow-sm" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-color" className="text-xs text-muted-foreground">
                  Or enter custom hex color
                </Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setColorPickerOpen(true)}
                    className="w-10 h-10 rounded-md border-2 border-border shrink-0 cursor-pointer hover:border-primary/50 transition-colors"
                    style={{ backgroundColor: customColorHex || "#ffffff" }}
                    title="Click to open color picker"
                  />
                  <Input
                    id="custom-color"
                    type="text"
                    value={customColorHex}
                    onChange={(e) => {
                      let value = e.target.value.trim()
                      if (value && !value.startsWith("#")) {
                        value = "#" + value
                      }
                      if (value === "" || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setCustomColorHex(value.toUpperCase())
                        if (value) {
                          setColorHex("")
                        }
                      }
                    }}
                    placeholder="#000000"
                    className="font-mono"
                    maxLength={7}
                  />
                </div>
                {customColorHex && (
                  <p className="text-xs text-muted-foreground">
                    Custom color: <span className="font-medium font-mono">{customColorHex}</span>
                  </p>
                )}
              </div>

              {colorPickerOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                  onClick={() => setColorPickerOpen(false)}
                >
                  <div
                    className="relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChromePicker
                      color={customColorHex || "#000000"}
                      onChange={(updated: { hex: string }) => {
                        const hex = updated.hex.toUpperCase()
                        setCustomColorHex(hex)
                        setColorHex("")
                      }}
                    />
                  </div>
                </div>
              )}

              {(colorHex || customColorHex) && (
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium font-mono" style={{ color: customColorHex || colorHex }}>
                    {customColorHex || colorHex}
                  </span>
                </p>
              )}
              {errors.color && (
                <p className="text-xs text-destructive">{errors.color}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label>Size</Label>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Clothing Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {CLOTHING_SIZES.map((sizeOption) => (
                    <Button
                      key={sizeOption}
                      type="button"
                      variant={size === sizeOption ? "default" : "outline"}
                      onClick={() => handleSizeSelect(sizeOption)}
                      className="min-w-[50px]"
                    >
                      {sizeOption}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Shoe Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {SHOE_SIZES.map((sizeOption) => (
                    <Button
                      key={sizeOption}
                      type="button"
                      variant={size === sizeOption ? "default" : "outline"}
                      onClick={() => handleSizeSelect(sizeOption)}
                      className="min-w-[50px]"
                    >
                      {sizeOption}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Numeric Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {NUMERIC_SIZES.map((sizeOption) => (
                    <Button
                      key={sizeOption}
                      type="button"
                      variant={size === sizeOption ? "default" : "outline"}
                      onClick={() => handleSizeSelect(sizeOption)}
                      className="min-w-[50px]"
                    >
                      {sizeOption}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Alphabetic Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {ALPHABETIC_SIZES.map((sizeOption) => (
                    <Button
                      key={sizeOption}
                      type="button"
                      variant={size === sizeOption ? "default" : "outline"}
                      onClick={() => handleSizeSelect(sizeOption)}
                      className="min-w-[50px]"
                    >
                      {sizeOption}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-size" className="text-xs text-muted-foreground">Custom Size</Label>
                <Input
                  id="custom-size"
                  value={customSize}
                  onChange={(e) => handleCustomSizeChange(e.target.value)}
                  placeholder="Enter custom size (e.g., 2T, 4T, One Size)"
                  maxLength={20}
                />
              </div>

              {(size || customSize) && (
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium">{customSize || size}</span>
                </p>
              )}
              {errors.size && (
                <p className="text-xs text-destructive">{errors.size}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g., Cotton, Polyester, Leather"
                maxLength={100}
              />
              {errors.material && (
                <p className="text-xs text-destructive">{errors.material}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity-stock">
                Stock Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity-stock"
                type="number"
                min="0"
                max="100000"
                value={quantityStock}
                onChange={(e) => setQuantityStock(e.target.value)}
                placeholder="0"
                required
              />
              <p className="text-xs text-muted-foreground">
                If this variant has orders, stock can only be increased. Stock
                also cannot go below units currently in carts.
              </p>
              {errors.quantity_stock && (
                <p className="text-xs text-destructive">{errors.quantity_stock}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku-variant">SKU Variant</Label>
              <Input
                id="sku-variant"
                value={skuVariant}
                onChange={(e) => setSkuVariant(e.target.value)}
                placeholder="Variant SKU"
                maxLength={255}
              />
              {errors.sku_variant && (
                <p className="text-xs text-destructive">{errors.sku_variant}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price-override">Price Override</Label>
              <Input
                id="price-override"
                type="number"
                step="0.01"
                min="0"
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
                placeholder={`Base price: ${formatPrice(productPrice)}`}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use base product price ({formatPrice(productPrice)})
              </p>
              {errors.price_override && (
                <p className="text-xs text-destructive">{errors.price_override}</p>
              )}
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
