'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { formatPrice } from "@/lib/utils"

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
  const [isOpen, setIsOpen] = useState(false)
  const [color, setColor] = useState<string>("")
  const [size, setSize] = useState<string>("")
  const [customSize, setCustomSize] = useState("")
  const [material, setMaterial] = useState("")
  const [quantityStock, setQuantityStock] = useState("")
  const [skuVariant, setSkuVariant] = useState("")
  const [priceOverride, setPriceOverride] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // TODO: Wire this up to a real admin create action / API
    const finalSize = customSize.trim() || size || null

    const newVariant = {
      product_id: productId,
      color: color || null,
      size: finalSize,
      material: material || null,
      quantity_stock: parseInt(quantityStock) || 0,
      sku_variant: skuVariant || null,
      price_override: priceOverride ? parseFloat(priceOverride) : null,
    }

    console.log("Creating variant:", newVariant)
    
    // Reset form
    setColor("")
    setSize("")
    setCustomSize("")
    setMaterial("")
    setQuantityStock("")
    setSkuVariant("")
    setPriceOverride("")
    setIsOpen(false)
    
    if (onVariantCreated) {
      onVariantCreated()
    }
  }

  const handleCancel = () => {
    setColor("")
    setSize("")
    setCustomSize("")
    setMaterial("")
    setQuantityStock("")
    setSkuVariant("")
    setPriceOverride("")
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
                  onClick={() => setColor(color === colorOption.value ? "" : colorOption.value)}
                  className={`
                    relative h-8 w-8 rounded-full border-2 transition-all shrink-0
                    ${color === colorOption.value 
                      ? 'border-primary ring-2 ring-primary ring-offset-1 scale-110' 
                      : 'border-border hover:border-primary/50 hover:scale-105'}
                  `}
                  style={{ backgroundColor: colorOption.hex }}
                  aria-label={colorOption.name}
                  title={colorOption.name}
                >
                  {color === colorOption.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white shadow-sm" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {color && (
              <p className="text-sm text-muted-foreground">Selected: <span className="font-medium">{color}</span></p>
            )}
          </div>

          {/* Size Selection */}
          <div className="space-y-4">
            <Label>Size</Label>
            
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
              />
            </div>

            {(size || customSize) && (
              <p className="text-sm text-muted-foreground">
                Selected: <span className="font-medium">{customSize || size}</span>
              </p>
            )}
          </div>

          {/* Material */}
          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Input
              id="material"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="e.g., Cotton, Polyester, Leather"
            />
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
              value={quantityStock}
              onChange={(e) => setQuantityStock(e.target.value)}
              placeholder="0"
              required
            />
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
          </div>

          {/* Price Override */}
          <div className="space-y-2">
            <Label htmlFor="price-override">Price Override</Label>
            <Input
              id="price-override"
              type="number"
              step="0.01"
              value={priceOverride}
              onChange={(e) => setPriceOverride(e.target.value)}
              placeholder={`Base price: ${formatPrice(productPrice)}`}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use base product price ({formatPrice(productPrice)})
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Create Variant
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
