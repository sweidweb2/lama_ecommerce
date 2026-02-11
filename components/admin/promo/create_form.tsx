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
import { createPromoCodeAction } from "@/actions/promo"
import { toast } from "sonner"

export type AdminPromoCode = {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number | null
  expires_at: string | null
  max_uses: number | null
  use_count: number
  is_active: boolean
  created_at?: string
}

interface CreatePromoCodeDialogProps {
  onCreated?: () => void
}

export function CreatePromoCodeDialog({ onCreated }: CreatePromoCodeDialogProps) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [maxUses, setMaxUses] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getMinExpiresAt = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, "0")
    const d = String(now.getDate()).padStart(2, "0")
    const h = String(now.getHours()).padStart(2, "0")
    const min = String(now.getMinutes()).padStart(2, "0")
    return `${y}-${m}-${d}T${h}:${min}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (expiresAt.trim() && new Date(expiresAt) <= new Date()) {
      toast.error("Expiration date cannot be in the past")
      return
    }
    setIsSubmitting(true)
    try {
      const result = await createPromoCodeAction({
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: discountValue ? parseFloat(discountValue) : null,
        expires_at: expiresAt || null,
        max_uses: maxUses ? parseInt(maxUses, 10) : null,
        is_active: isActive,
      })

      if (result.success) {
        setCode("")
        setDiscountType('percentage')
        setDiscountValue("")
        setExpiresAt("")
        setMaxUses("")
        setIsActive(true)
        setOpen(false)
        onCreated?.()
        toast.success("Promo code created")
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error("Error creating promo code:", error)
      toast.error("Failed to create promo code")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setCode("")
    setDiscountType('percentage')
    setDiscountValue("")
    setExpiresAt("")
    setMaxUses("")
    setIsActive(true)
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Promo Code
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="promo-code">
                Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="promo-code"
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
                <Label htmlFor="discount-type">
                  Discount Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={discountType}
                  onValueChange={(value) => setDiscountType(value as 'percentage' | 'fixed')}
                >
                  <SelectTrigger id="discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount-value">
                  Discount Value <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="discount-value"
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
                <Label htmlFor="expires-at">Expiration Date</Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  min={getMinExpiresAt()}
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no expiration. Cannot be in the past.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-uses">Max Uses</Label>
                <Input
                  id="max-uses"
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
                  id="is-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="is-active" className="cursor-pointer">
                  Active
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Inactive promo codes cannot be used by customers
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Promo Code"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
