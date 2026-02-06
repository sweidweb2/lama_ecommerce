'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit } from "lucide-react"

// Dummy customised products for selection
const DUMMY_CUSTOMISED_PRODUCTS = [
  {
    id: "variant-1",
    product_id: "prod-1-1",
    product_name: "Tech Pro Station",
    color: "Black",
    size: "M",
    material: "Cotton",
    sku_variant: "ELEC-001-BLK-M",
    price_override: null,
    base_price: 999.99,
  },
  {
    id: "variant-2",
    product_id: "prod-1-2",
    product_name: "Wireless Headphones",
    color: "White",
    size: "L",
    material: "Plastic",
    sku_variant: "ELEC-002-WHT-L",
    price_override: null,
    base_price: 299.99,
  },
  {
    id: "variant-3",
    product_id: "prod-2-1",
    product_name: "Classic T-Shirt",
    color: "Red",
    size: "S",
    material: "Cotton",
    sku_variant: "FASH-001-RED-S",
    price_override: 29.99,
    base_price: 39.99,
  },
  {
    id: "variant-4",
    product_id: "prod-2-2",
    product_name: "Denim Jeans",
    color: "Blue",
    size: "32",
    material: "Denim",
    sku_variant: "FASH-002-BLU-32",
    price_override: null,
    base_price: 79.99,
  },
]

export type CartItem = {
  id: string
  cart_id: string
  customised_product_id: string
  quantity: number
  created_at?: string
  deleted_at?: string | null
  // Extended fields for display
  product_name?: string
  color?: string
  size?: string
  material?: string
  price?: number
}

interface EditCartItemDialogProps {
  cartItem: CartItem
  showText?: boolean
}

export function EditCartItemDialog({ cartItem, showText = false }: EditCartItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [customisedProductId, setCustomisedProductId] = useState<string>(cartItem.customised_product_id)
  const [quantity, setQuantity] = useState<string>(cartItem.quantity.toString())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customisedProductId || !quantity || parseInt(quantity) <= 0) {
      alert("Please select a product and enter a valid quantity")
      return
    }

    // TODO: Wire this up to a real admin update action / API
    const updatedCartItem = {
      id: cartItem.id,
      cart_id: cartItem.cart_id,
      customised_product_id: customisedProductId,
      quantity: parseInt(quantity),
    }

    console.log("Updating cart item:", updatedCartItem)

    setOpen(false)
  }

  const handleCancel = () => {
    // Reset to original values
    setCustomisedProductId(cartItem.customised_product_id)
    setQuantity(cartItem.quantity.toString())
    setOpen(false)
  }

  const selectedProduct = DUMMY_CUSTOMISED_PRODUCTS.find(
    (p) => p.id === customisedProductId
  )

  return (
    <>
      <Button
        variant={showText ? "outline" : "ghost"}
        size={showText ? "default" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`Edit cart item ${cartItem.id}`}
      >
        <Edit className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
        {showText && "Edit"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cart Item</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor={`customised-product-${cartItem.id}`}>
                Product Variant <span className="text-destructive">*</span>
              </Label>
              <Select value={customisedProductId} onValueChange={setCustomisedProductId}>
                <SelectTrigger id={`customised-product-${cartItem.id}`}>
                  <SelectValue placeholder="Select a product variant" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_CUSTOMISED_PRODUCTS.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.product_name} - {variant.color} / {variant.size} / {variant.material}
                      {variant.price_override ? ` ($${variant.price_override})` : ` ($${variant.base_price})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                <p className="font-medium">Selected Product:</p>
                <p className="text-muted-foreground">
                  {selectedProduct.product_name} - {selectedProduct.color} / {selectedProduct.size} / {selectedProduct.material}
                </p>
                <p className="text-muted-foreground">
                  SKU: {selectedProduct.sku_variant}
                </p>
                <p className="font-medium">
                  Price: ${selectedProduct.price_override || selectedProduct.base_price}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={`quantity-${cartItem.id}`}>
                Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`quantity-${cartItem.id}`}
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
              />
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!customisedProductId || !quantity || parseInt(quantity) <= 0}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
