'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { createProductVariantAction } from "@/actions/product"
import { z } from "zod"
import { createProductVariantSchema } from "@/lib/validators/product_variant/create"
import { ChromePicker } from "react-color"

interface CreateVariantFormProps {
  productId: string
  productPrice: number
  onVariantCreated?: () => void
}

const COLOR_PALETTE = [
  { name: 'Black', value: 'Black', hex: '#000000' },
  { name: 'White', value: 'White', hex: '#FFFFFF' },
  { name: 'Red', value: 'Red', hex: '#EF4444' },
  { name: 'Blue', value: 'Blue', hex: '#3B82F6' },
  { name: 'Green', value: 'Green', hex: '#10B981' },
  { name: 'Yellow', value: 'Yellow', hex: '#F59E0B' },
  { name: 'Purple', value: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', value: 'Pink', hex: '#EC4899' },
  { name: 'Gray', value: 'Gray', hex: '#6B7280' },
  { name: 'Brown', value: 'Brown', hex: '#92400E' },
  { name: 'Orange', value: 'Orange', hex: '#F97316' },
  { name: 'Navy', value: 'Navy', hex: '#1E3A8A' },
  { name: 'Beige', value: 'Beige', hex: '#F5F5DC' },
  { name: 'Maroon', value: 'Maroon', hex: '#800000' },
  { name: 'Teal', value: 'Teal', hex: '#14B8A6' },
  { name: 'Lime', value: 'Lime', hex: '#84CC16' },
  { name: 'Cyan', value: 'Cyan', hex: '#06B6D4' },
  { name: 'Indigo', value: 'Indigo', hex: '#4F46E5' },
  { name: 'Violet', value: 'Violet', hex: '#A855F7' },
  { name: 'Rose', value: 'Rose', hex: '#F43F5E' },
  { name: 'Amber', value: 'Amber', hex: '#FBBF24' },
  { name: 'Emerald', value: 'Emerald', hex: '#059669' },
  { name: 'Sky', value: 'Sky', hex: '#0EA5E9' },
  { name: 'Slate', value: 'Slate', hex: '#64748B' },
  { name: 'Cream', value: 'Cream', hex: '#FFFDD0' },
  { name: 'Gold', value: 'Gold', hex: '#FCD34D' },
  { name: 'Silver', value: 'Silver', hex: '#C0C0C0' },
]

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47']
const NUMERIC_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46']
const ALPHABETIC_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

export function CreateVariantForm({ productId, productPrice, onVariantCreated }: CreateVariantFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
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
  const [errors, setErrors] = useState<Partial<Record<keyof z.input<typeof createProductVariantSchema>, string>>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const finalSize = customSize.trim() || size || null
    const trimmedMaterial = material.trim() || null
    const trimmedSkuVariant = skuVariant.trim() || null

    const candidate: z.input<typeof createProductVariantSchema> = {
      product_id: productId,
      color: customColorHex || colorHex || null,
      size: finalSize,
      material: trimmedMaterial,
      quantity_stock: quantityStock ? Number(quantityStock) : 0,
      sku_variant: trimmedSkuVariant,
      price_override: priceOverride ? Number(priceOverride) : null,
    }

    const parsed = createProductVariantSchema.safeParse(candidate)

    if (!parsed.success) {
      const fieldErrors: Partial<
        Record<keyof z.input<typeof createProductVariantSchema>, string>
      > = {}

      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof z.input<typeof createProductVariantSchema>
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
      formData.set("product_id", parsed.data.product_id)
      formData.set("color", parsed.data.color ?? "")
      formData.set("size", parsed.data.size ?? "")
      formData.set("material", parsed.data.material ?? "")
      formData.set("quantity_stock", parsed.data.quantity_stock.toString())
      formData.set("sku_variant", parsed.data.sku_variant ?? "")
      formData.set("price_override", parsed.data.price_override?.toString() ?? "")

      await createProductVariantAction(formData)

      // Reset form
      setColorHex("")
      setCustomColorHex("")
      setSize("")
      setCustomSize("")
      setMaterial("")
      setQuantityStock("")
      setSkuVariant("")
      setPriceOverride("")
      setIsOpen(false)

      // Refresh to show new variant
      router.refresh()

      if (onVariantCreated) {
        onVariantCreated()
      }
    } catch (error) {
      console.error("Error creating variant:", error)
      setErrors({ quantity_stock: "Failed to create variant. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setColorHex("")
    setCustomColorHex("")
    setSize("")
    setCustomSize("")
    setMaterial("")
    setQuantityStock("")
    setSkuVariant("")
    setPriceOverride("")
    setErrors({})
    setIsOpen(false)
  }

  const handleSizeSelect = (selectedSize: string) => {
    setSize(selectedSize === size ? "" : selectedSize)
    // Clear custom size when selecting from groups
    if (selectedSize !== size) {
      setCustomSize("")
    }
  }

  const handleCustomSizeChange = (value: string) => {
    setCustomSize(value)
    // Clear selected size when typing custom size
    if (value) {
      setSize("")
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        Create Customized Product
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Create Customized Product</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Color Palette */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {COLOR_PALETTE.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => {
                    setColorHex(colorHex === colorOption.hex ? "" : colorOption.hex)
                    setCustomColorHex("") // Clear custom input when selecting from palette
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
            
            {/* Custom Hex Color Input */}
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
                    // Add # if user types without it
                    if (value && !value.startsWith("#")) {
                      value = "#" + value
                    }
                    // Validate hex format (basic)
                    if (value === "" || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                      setCustomColorHex(value.toUpperCase())
                      if (value) {
                        setColorHex("") // Deselect palette color when typing custom
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

            {/* Color Picker Overlay */}
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
                    onChange={(updated) => {
                      const hex = updated.hex.toUpperCase()
                      setCustomColorHex(hex)
                      setColorHex("") // Deselect palette color when using picker
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

          {/* Size Selection */}
          <div className="space-y-4">
            <Label>
              Size <span className="text-destructive">*</span>
            </Label>
            
            {/* Clothing Sizes */}
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

            {/* Shoe Sizes */}
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

            {/* Numeric Sizes */}
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

            {/* Alphabetic Sizes */}
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

            {/* Custom Size Input */}
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

          {/* Material */}
          <div className="space-y-2">
            <Label htmlFor="material">
              Material <span className="text-destructive">*</span>
            </Label>
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

          {/* Stock Quantity */}
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
            {errors.quantity_stock && (
              <p className="text-xs text-destructive">{errors.quantity_stock}</p>
            )}
          </div>

          {/* SKU Variant */}
          <div className="space-y-2">
            <Label htmlFor="sku-variant">SKU Variant</Label>
            <Input
              id="sku-variant"
              value={skuVariant}
              onChange={(e) => setSkuVariant(e.target.value)}
              placeholder="Variant SKU"
            />
            {errors.sku_variant && (
              <p className="text-xs text-destructive">{errors.sku_variant}</p>
            )}
          </div>

          {/* Price Override */}
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Variant"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
