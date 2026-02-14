'use client'

import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getAdminProductsAction, getProductVariantsAction } from "@/actions/product"
import { addItemToCartByIdAction } from "@/actions/cart"
import type { ProductWithRelations, ProductVariant } from "@/types/product"

interface AddCartItemDialogProps {
  cartId: string
  onAdd?: (data: {
    product_id: string
    customised_product_id: string
    quantity: number
  }) => void | Promise<void>
  showText?: boolean
}

// Color mapping for visual color swatches
const COLOR_MAP: Record<string, string> = {
  'Red': '#EF4444',
  'Blue': '#3B82F6',
  'Green': '#10B981',
  'Yellow': '#F59E0B',
  'Black': '#000000',
  'White': '#FFFFFF',
  'Gray': '#6B7280',
  'Grey': '#6B7280',
  'Purple': '#8B5CF6',
  'Pink': '#EC4899',
  'Orange': '#F97316',
  'Brown': '#92400E',
  'Navy': '#1E3A8A',
  'Beige': '#F5F5DC',
  'Tan': '#D2B48C',
}

export function AddCartItemDialog({ cartId, onAdd, showText = false }: AddCartItemDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  
  // Data state
  const [products, setProducts] = useState<ProductWithRelations[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // Fetch products when dialog opens
  useEffect(() => {
    if (open) {
      fetchProducts()
    }
  }, [open])

  // Fetch variants when product is selected
  useEffect(() => {
    if (selectedProductId) {
      fetchVariants(selectedProductId)
    } else {
      setVariants([])
      setSelectedColor(null)
      setSelectedSize(null)
      setSelectedMaterial(null)
    }
  }, [selectedProductId])

  const fetchProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const data = await getAdminProductsAction()
      setProducts(data)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const fetchVariants = async (productId: string) => {
    try {
      const data = await getProductVariantsAction(productId)
      setVariants(data)
    } catch (error) {
      console.error("Error fetching variants:", error)
      setVariants([])
    }
  }

  // Extract unique attribute values from variants
  const colors = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[]
  }, [variants])

  const sizes = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[]
  }, [variants])

  const materials = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.material).filter(Boolean))) as string[]
  }, [variants])

  // Find matching variant based on selections
  const selectedVariant = useMemo(() => {
    if (!selectedProductId || variants.length === 0) return undefined

    const hasRequiredColor = colors.length === 0 || selectedColor !== null
    const hasRequiredSize = sizes.length === 0 || selectedSize !== null
    const hasRequiredMaterial = materials.length === 0 || selectedMaterial !== null

    if (!hasRequiredColor || !hasRequiredSize || !hasRequiredMaterial) {
      return undefined
    }

    return variants.find((v) => {
      const colorMatch = colors.length === 0 || v.color === selectedColor
      const sizeMatch = sizes.length === 0 || v.size === selectedSize
      const materialMatch = materials.length === 0 || v.material === selectedMaterial
      return colorMatch && sizeMatch && materialMatch && v.quantity_stock > 0
    })
  }, [variants, selectedColor, selectedSize, selectedMaterial, colors.length, sizes.length, materials.length, selectedProductId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProductId) {
      toast.error("Error", {
        description: "Please select a product",
      })
      return
    }

    if (!selectedVariant) {
      toast.error("Error", {
        description: "Please select a valid variant (color, size, material)",
      })
      return
    }

    setIsSubmitting(true)
    try {
      if (onAdd) {
        await onAdd({
          product_id: selectedProductId,
          customised_product_id: selectedVariant.id,
          quantity,
        })
      } else {
        // Use the add item to cart action
        const result = await addItemToCartByIdAction(cartId, {
          customised_product_id: selectedVariant.id,
          quantity,
        })

        if (!result.success) {
          toast.error("Error", {
            description: result.error || "Failed to add item to cart. Please try again.",
          })
          return
        }

        toast.success("Item added", {
          description: "The item has been successfully added to the cart.",
        })
      }
      
      // Reset form
      setSelectedProductId("")
      setSelectedColor(null)
      setSelectedSize(null)
      setSelectedMaterial(null)
      setQuantity(1)
      setVariants([])
      setOpen(false)
      
      // Refresh the page to show the new item
      router.refresh()
    } catch (error) {
      console.error("Error adding cart item:", error)
      toast.error("Error", {
        description: "Failed to add item to cart. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedProductId("")
    setSelectedColor(null)
    setSelectedSize(null)
    setSelectedMaterial(null)
    setQuantity(1)
    setOpen(false)
  }

  const isFormValid = selectedProductId && selectedVariant && quantity > 0

  return (
    <>
      <Button
        variant={showText ? "default" : "outline"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label="Add items to cart"
      >
        <Plus className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Add Items"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Items to Cart</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product">
                Product <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
                disabled={isLoadingProducts}
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      {isLoadingProducts ? "Loading products..." : "No products available"}
                    </SelectItem>
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Variant Selection - Only show if product is selected and has variants */}
            {selectedProductId && variants.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                {/* Color Selection */}
                {colors.length > 0 && (
                  <div className="space-y-2">
                    <Label>
                      Color {colors.length > 0 && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => {
                        const isAvailable = variants.some(
                          (v) =>
                            v.color === color &&
                            (sizes.length === 0 || !selectedSize || v.size === selectedSize) &&
                            (materials.length === 0 || !selectedMaterial || v.material === selectedMaterial) &&
                            v.quantity_stock > 0
                        )
                        const isSelected = selectedColor === color
                        const colorHex = COLOR_MAP[color] || '#6B7280'

                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(isSelected ? null : color)}
                            disabled={!isAvailable}
                            className={cn(
                              "h-10 w-10 rounded-full border-2 transition-all",
                              isSelected
                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                : "border-gray-300 hover:border-gray-400",
                              !isAvailable && "opacity-50 cursor-not-allowed"
                            )}
                            style={{ backgroundColor: colorHex }}
                            title={color}
                            aria-label={`Select color ${color}`}
                          />
                        )
                      })}
                    </div>
                    {selectedColor && (
                      <p className="text-xs text-muted-foreground">Selected: {selectedColor}</p>
                    )}
                  </div>
                )}

                {/* Size Selection */}
                {sizes.length > 0 && (
                  <div className="space-y-2">
                    <Label>
                      Size {sizes.length > 0 && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => {
                        const isAvailable = variants.some(
                          (v) =>
                            v.size === size &&
                            (colors.length === 0 || !selectedColor || v.color === selectedColor) &&
                            (materials.length === 0 || !selectedMaterial || v.material === selectedMaterial) &&
                            v.quantity_stock > 0
                        )
                        const isSelected = selectedSize === size

                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(isSelected ? null : size)}
                            disabled={!isAvailable}
                            className={cn(
                              "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-gray-300 hover:border-gray-400",
                              !isAvailable && "opacity-50 cursor-not-allowed"
                            )}
                            aria-label={`Select size ${size}`}
                          >
                            {size}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Material Selection */}
                {materials.length > 0 && (
                  <div className="space-y-2">
                    <Label>
                      Material {materials.length > 0 && <span className="text-destructive">*</span>}
                    </Label>
                    <Select
                      value={selectedMaterial || ""}
                      onValueChange={(value) => setSelectedMaterial(value || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material) => {
                          const isAvailable = variants.some(
                            (v) =>
                              v.material === material &&
                              (colors.length === 0 || !selectedColor || v.color === selectedColor) &&
                              (sizes.length === 0 || !selectedSize || v.size === selectedSize) &&
                              v.quantity_stock > 0
                          )
                          return (
                            <SelectItem
                              key={material}
                              value={material}
                              disabled={!isAvailable}
                            >
                              {material}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Selected Variant Info */}
                {selectedVariant && (
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <p className="text-sm font-medium">Selected Variant</p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {selectedVariant.quantity_stock} units
                    </p>
                    {selectedVariant.sku_variant && (
                      <p className="text-xs text-muted-foreground">
                        SKU: {selectedVariant.sku_variant}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quantity Input */}
            {selectedVariant && (
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedVariant.quantity_stock}
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    setQuantity(Math.min(Math.max(1, value), selectedVariant.quantity_stock))
                  }}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Available stock: {selectedVariant.quantity_stock} units
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add to Cart"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
