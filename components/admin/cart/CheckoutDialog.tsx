'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatPrice } from '@/lib/utils'
import { checkoutForAdminAction } from '@/actions/checkout'
import { getCartWithItemsForAdminAction } from '@/actions/cart'
import { getPublicShippingZonesAction } from '@/actions/shipping'

interface ShippingZoneOption {
  id: string
  name: string
  estimated_time: string | null
  fee: number | null
}

interface CheckoutDialogProps {
  cartId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CheckoutDialog({
  cartId,
  open,
  onOpenChange,
  onSuccess,
}: CheckoutDialogProps) {
  const router = useRouter()
  const isProcessingRef = useRef(false)
  const [isLoading, setIsLoading] = useState(false)
  const [subtotal, setSubtotal] = useState(0)
  const [shippingZones, setShippingZones] = useState<ShippingZoneOption[]>([])

  // Shipping
  const [selectedZoneId, setSelectedZoneId] = useState<string>('')

  // Address
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')

  // Contact
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [promoCode, setPromoCode] = useState('')

  // Load cart data and shipping zones when dialog opens
  useEffect(() => {
    if (open && cartId) {
      loadCartData()
      loadShippingZones()
    } else {
      // Reset form when dialog closes
      resetForm()
    }
  }, [open, cartId])

  const loadCartData = async () => {
    setIsLoading(true)
    try {
      const result = await getCartWithItemsForAdminAction(cartId)
      if (result.success && result.data) {
        setSubtotal(result.data.subtotal)
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to load cart data',
        })
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error loading cart data:', error)
      toast.error('Error', {
        description: 'Failed to load cart data',
      })
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  const loadShippingZones = async () => {
    try {
      const zones = await getPublicShippingZonesAction()
      setShippingZones(zones)
    } catch (error) {
      console.error('Error loading shipping zones:', error)
      toast.error('Error', {
        description: 'Failed to load shipping zones',
      })
    }
  }

  const resetForm = () => {
    setSelectedZoneId('')
    setCountry('')
    setCity('')
    setAddress('')
    setPostalCode('')
    setPhone('')
    setEmail('')
    setPromoCode('')
  }

  // Derived values
  const selectedZone = shippingZones.find((z) => z.id === selectedZoneId)
  const shippingFee = selectedZone?.fee ?? 0
  const total = subtotal + shippingFee

  const isFormValid =
    selectedZoneId &&
    country.trim() &&
    city.trim() &&
    address.trim() &&
    phone.trim().length >= 5 &&
    email.includes('@')

  const handleCheckout = async () => {
    // Double-click protection
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    try {
      const result = await checkoutForAdminAction({
        cart_id: cartId,
        shipping_zone_id: selectedZoneId,
        address: {
          country: country.trim(),
          city: city.trim(),
          address: address.trim(),
          postal_code: postalCode.trim() || '',
        },
        phone: phone.trim(),
        email: email.trim(),
        promo_code: promoCode.trim() || undefined,
      })

      if (result.success) {
        toast.success('Order placed!', {
          description: 'The order has been created successfully.',
        })

        // Close dialog and refresh
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        }
        router.refresh()
      } else {
        toast.error('Checkout failed', {
          description: result.error || 'Please try again.',
        })
      }
    } catch (error) {
      console.error('Error during checkout:', error)
      toast.error('Checkout error', {
        description: 'An unexpected error occurred.',
      })
    } finally {
      isProcessingRef.current = false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>
            Complete the checkout form to create an order from this cart.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading cart data...
          </div>
        ) : (
          <div className="rounded-2xl border border-black/5 bg-[#f9f9f9] dark:bg-card p-4 space-y-3">
            <h2 className="text-lg font-black tracking-tight">Order Summary</h2>

            {/* Subtotal */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
            </div>

            {/* Shipping Zone Selection */}
            <div className="space-y-2 pt-1.5 border-t border-black/5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Shipping Zone <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select shipping zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingZones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        <div className="flex flex-col">
                          <span>{zone.name}</span>
                          {zone.estimated_time && (
                            <span className="text-xs text-muted-foreground">
                              {zone.estimated_time}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Shipping Fee */}
              {selectedZoneId && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">
                      Shipping Fee
                    </span>
                    <span className="text-sm font-semibold">
                      {selectedZone ? formatPrice(shippingFee) : 'N/A'}
                    </span>
                  </div>
                  {selectedZone?.estimated_time && (
                    <p className="text-xs text-muted-foreground">
                      Estimated delivery: {selectedZone.estimated_time}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Promo code */}
            <div className="space-y-2 pt-1.5 border-t border-black/5">
              <Label className="text-sm font-medium" htmlFor="admin-promo-code">
                Promo code
              </Label>
              <Input
                id="admin-promo-code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Optional"
                className="h-8 text-sm"
                autoComplete="off"
              />
            </div>

            {/* Address Fields */}
            <div className="space-y-2 pt-1.5 border-t border-black/5">
              <p className="text-sm font-medium">Shipping Address</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Country <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Street address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Postal Code</Label>
                <Input
                  placeholder="Postal code (optional)"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div className="space-y-2 pt-1.5 border-t border-black/5">
              <p className="text-sm font-medium">Contact Information</p>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-8 text-sm"
                  type="tel"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 text-sm"
                  type="email"
                />
              </div>
            </div>

            {/* Summary Line */}
            <div className="space-y-1.5 text-sm pt-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">
                  {selectedZoneId ? formatPrice(shippingFee) : formatPrice(0)}
                </span>
              </div>
            </div>

            {/* Estimated total (promo applied at checkout) */}
            <div className="border-t border-black/5 pt-2 space-y-1">
              <div className="flex justify-between items-center text-sm font-bold">
                <span>Estimated total</span>
                <span className="text-lg">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Subtotal + shipping. Promo codes are applied when you place the order;
                order details show the charged total.
              </p>
            </div>

            {/* Checkout Button */}
            <Button
              size="lg"
              className="w-full rounded-2xl text-sm"
              disabled={!isFormValid || isProcessingRef.current}
              onClick={handleCheckout}
            >
              {!selectedZoneId
                ? 'Select Shipping Zone to Continue'
                : !isFormValid
                  ? 'Fill All Required Fields'
                  : isProcessingRef.current
                    ? 'Processing...'
                    : 'Place Order'}
            </Button>

            {!isFormValid && (
              <p className="text-xs text-muted-foreground text-center">
                Please fill in all required fields to place your order
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
