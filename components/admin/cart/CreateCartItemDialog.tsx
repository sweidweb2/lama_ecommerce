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
import { Plus } from "lucide-react"
import { toast } from "sonner"

// Dummy customised products for selection
// In a real app, this would be fetched from the database
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

interface CreateCartItemDialogProps {
  cartId: string
}

export function CreateCartItemDialog({ cartId }: CreateCartItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [customisedProductId, setCustomisedProductId] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("1")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customisedProductId || !quantity || parseInt(quantity) <= 0) {
      toast.error("Please select a product and enter a valid quantity")
      return
    }

    // TODO: Wire this up to a real admin create action / API
    const newCartItem = {
      cart_id: cartId,
      customised_product_id: customisedProductId,
      quantity: parseInt(quantity),
    }

    console.log("Creating cart item:", newCartItem)

    // Reset form
    setCustomisedProductId("")
    setQuantity("1")
    setOpen(false)
  }

  const handleCancel = () => {
    setCustomisedProductId("")
    setQuantity("1")
    setOpen(false)
  }

  const selectedProduct = DUMMY_CUSTOMISED_PRODUCTS.find(
    (p) => p.id === customisedProductId
  )

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cart Item</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="customised-product">
                Product Variant <span className="text-destructive">*</span>
              </Label>
              <Select value={customisedProductId} onValueChange={setCustomisedProductId}>
                <SelectTrigger id="customised-product">
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
              <Label htmlFor="quantity">
                Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
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
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
