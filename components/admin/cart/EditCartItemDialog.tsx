'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit } from "lucide-react"
import { updateCartItemAction } from "@/actions/cart"
import { toast } from "sonner"

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
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState<string>(cartItem.quantity.toString())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync quantity state when cartItem prop changes (after page refresh)
  useEffect(() => {
    setQuantity(cartItem.quantity.toString())
  }, [cartItem.quantity])

  // Reset quantity when dialog opens to ensure we have the latest value
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      // Reset to current cart item quantity when opening
      setQuantity(cartItem.quantity.toString())
    } else {
      // Reset to original values when closing
      setQuantity(cartItem.quantity.toString())
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const quantityNum = parseInt(quantity)
    if (!quantity || isNaN(quantityNum) || quantityNum <= 0) {
      toast.error("Error", {
        description: "Please enter a valid quantity (must be at least 1)",
      })
      return
    }

    // Don't submit if quantity hasn't changed
    if (quantityNum === cartItem.quantity) {
      toast.info("No changes", {
        description: "Quantity is already set to this value",
      })
      setOpen(false)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateCartItemAction(
        cartItem.id,
        quantityNum,
        cartItem.cart_id
      )

      if (result.success) {
        toast.success("Success", {
          description: "Cart item quantity updated successfully",
        })
        setOpen(false)
        // Refresh the page to update table and summary with new data
        router.refresh()
      } else {
        toast.error("Error", {
          description: result.error || "Failed to update cart item",
        })
      }
    } catch (error) {
      console.error("Error updating cart item:", error)
      toast.error("Error", {
        description: "An unexpected error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Reset to original values
    setQuantity(cartItem.quantity.toString())
    setOpen(false)
  }

  // Format variant display
  const variantDisplay = cartItem.color && cartItem.size && cartItem.material
    ? `${cartItem.color} / ${cartItem.size} / ${cartItem.material}`
    : cartItem.color || cartItem.size || cartItem.material
    ? [cartItem.color, cartItem.size, cartItem.material].filter(Boolean).join(" / ")
    : "Standard"

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

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cart Item Quantity</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            {/* Display product information (read-only) */}
            <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
              <p className="font-medium">Product:</p>
              <p className="text-muted-foreground">
                {cartItem.product_name || "Unknown Product"}
              </p>
              {variantDisplay !== "Standard" && (
                <p className="text-muted-foreground">
                  Variant: {variantDisplay}
                </p>
              )}
              {cartItem.price !== undefined && (
                <p className="font-medium">
                  Price: ${cartItem.price.toFixed(2)}
                </p>
              )}
            </div>

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
                disabled={isSubmitting}
              />
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
              <Button
                type="submit"
                disabled={!quantity || parseInt(quantity) <= 0 || isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Quantity"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
