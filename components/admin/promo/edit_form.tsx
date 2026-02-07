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
import type { AdminPromoCode } from "./create_form"

interface EditPromoCodeDialogProps {
  promoCode: AdminPromoCode
  onUpdated?: () => void
}

export function EditPromoCodeDialog({ promoCode, onUpdated }: EditPromoCodeDialogProps) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState(promoCode.code)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(promoCode.discount_type)
  const [discountValue, setDiscountValue] = useState(promoCode.discount_value?.toString() || "")
  const [expiresAt, setExpiresAt] = useState(
    promoCode.expires_at 
      ? new Date(promoCode.expires_at).toISOString().slice(0, 16)
      : ""
  )
  const [maxUses, setMaxUses] = useState(promoCode.max_uses?.toString() || "")
  const [isActive, setIsActive] = useState(promoCode.is_active)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const updatedPromoCode = {
      id: promoCode.id,
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: discountValue ? parseFloat(discountValue) : null,
      expires_at: expiresAt || null,
      max_uses: maxUses ? parseInt(maxUses) : null,
      is_active: isActive,
    }

    try {
      // TODO: Wire this up to a real admin update action / API
      const response = await fetch(`/api/admin/promo-codes/${promoCode.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPromoCode),
      })

      if (!response.ok) {
        throw new Error("Failed to update promo code")
      }

      setOpen(false)
      onUpdated?.()
    } catch (error) {
      console.error("Error updating promo code:", error)
      // TODO: Show error toast
    }
  }

  const handleCancel = () => {
    setCode(promoCode.code)
    setDiscountType(promoCode.discount_type)
    setDiscountValue(promoCode.discount_value?.toString() || "")
    setExpiresAt(
      promoCode.expires_at 
        ? new Date(promoCode.expires_at).toISOString().slice(0, 16)
        : ""
    )
    setMaxUses(promoCode.max_uses?.toString() || "")
    setIsActive(promoCode.is_active)
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Edit promo code ${promoCode.code}`}
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promo Code</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor={`promo-code-${promoCode.id}`}>
                Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`promo-code-${promoCode.id}`}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SAVE20"
                required
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Enter a unique promotional code (will be converted to uppercase)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`discount-type-${promoCode.id}`}>
                  Discount Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={discountType}
                  onValueChange={(value) => setDiscountType(value as 'percentage' | 'fixed')}
                >
                  <SelectTrigger id={`discount-type-${promoCode.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`discount-value-${promoCode.id}`}>
                  Discount Value <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`discount-value-${promoCode.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? "20" : "10.00"}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {discountType === 'percentage' 
                    ? "Enter percentage (e.g., 20 for 20%)" 
                    : "Enter fixed amount in dollars"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`expires-at-${promoCode.id}`}>Expiration Date</Label>
                <Input
                  id={`expires-at-${promoCode.id}`}
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no expiration
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`max-uses-${promoCode.id}`}>Max Uses</Label>
                <Input
                  id={`max-uses-${promoCode.id}`}
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of times this code can be used (leave empty for unlimited)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`is-active-${promoCode.id}`}
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor={`is-active-${promoCode.id}`} className="cursor-pointer">
                  Active
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Inactive promo codes cannot be used by customers
              </p>
            </div>

            <div className="space-y-2">
              <Label>Usage Statistics</Label>
              <div className="text-sm text-muted-foreground">
                Used: {promoCode.use_count} {promoCode.max_uses ? `of ${promoCode.max_uses}` : '(unlimited)'}
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
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
