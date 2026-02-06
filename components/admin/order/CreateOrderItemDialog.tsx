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

const NONE_VALUE = "__none__"

interface CreateOrderItemDialogProps {
  orderId: string
}

export function CreateOrderItemDialog({ orderId }: CreateOrderItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [customisedProductId, setCustomisedProductId] = useState<string>(NONE_VALUE)
  const [productName, setProductName] = useState<string>("")
  const [color, setColor] = useState<string>("")
  const [size, setSize] = useState<string>("")
  const [material, setMaterial] = useState<string>("")
  const [price, setPrice] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("1")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!quantity || parseInt(quantity) <= 0) {
      alert("Please enter a valid quantity")
      return
    }

    const selectedProduct = customisedProductId !== NONE_VALUE
      ? DUMMY_CUSTOMISED_PRODUCTS.find((p) => p.id === customisedProductId)
      : null

    // TODO: Wire this up to a real admin create action / API
    const newOrderItem = {
      order_id: orderId,
      customised_product_id: customisedProductId !== NONE_VALUE ? customisedProductId : null,
      quantity: parseInt(quantity),
      price_snapshot: price ? parseFloat(price) : (selectedProduct?.price_override || selectedProduct?.base_price || null),
      product_name_snapshot: productName || selectedProduct?.product_name || null,
      color_snapshot: color || selectedProduct?.color || null,
      size_snapshot: size || selectedProduct?.size || null,
      material_snapshot: material || selectedProduct?.material || null,
    }

    console.log("Creating order item:", newOrderItem)

    // Reset form
    setCustomisedProductId(NONE_VALUE)
    setProductName("")
    setColor("")
    setSize("")
    setMaterial("")
    setPrice("")
    setQuantity("1")
    setOpen(false)
  }

  const handleCancel = () => {
    setCustomisedProductId(NONE_VALUE)
    setProductName("")
    setColor("")
    setSize("")
    setMaterial("")
    setPrice("")
    setQuantity("1")
    setOpen(false)
  }

  const selectedProduct = customisedProductId !== NONE_VALUE
    ? DUMMY_CUSTOMISED_PRODUCTS.find((p) => p.id === customisedProductId)
    : null

  const handleProductSelect = (value: string) => {
    setCustomisedProductId(value)
    if (value !== NONE_VALUE) {
      const product = DUMMY_CUSTOMISED_PRODUCTS.find((p) => p.id === value)
      if (product) {
        setProductName(product.product_name)
        setColor(product.color)
        setSize(product.size)
        setMaterial(product.material)
        setPrice((product.price_override || product.base_price).toString())
      }
    } else {
      setProductName("")
      setColor("")
      setSize("")
      setMaterial("")
      setPrice("")
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Order Item</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="customised-product">
                Product Variant <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Select value={customisedProductId} onValueChange={handleProductSelect}>
                <SelectTrigger id="customised-product">
                  <SelectValue placeholder="Select a product variant or enter manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Enter Manually</SelectItem>
                  {DUMMY_CUSTOMISED_PRODUCTS.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.product_name} - {variant.color} / {variant.size} / {variant.material}
                      {variant.price_override ? ` ($${variant.price_override})` : ` ($${variant.base_price})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-name">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Color"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="Size"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Material"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
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
                disabled={!productName || !price || !quantity || parseInt(quantity) <= 0}
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
