"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import { checkoutAction } from "@/actions/checkout";
import { CheckoutModal } from "@/components/(public)/cart/CheckoutModal";

interface ShippingZoneOption {
  id: string;
  name: string;
  estimated_time: string | null;
  fee: number | null;
}

interface CartSidebarProps {
  subtotal: number;
  cartId: string;
  shippingZones: ShippingZoneOption[];
}

export function CartSidebar({ subtotal, cartId, shippingZones = [] }: CartSidebarProps) {
  const router = useRouter();
  const isProcessingRef = useRef(false);

  // Shipping
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");

  // Address
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Contact
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<{
    shippingZone?: string;
    country?: string;
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
  }>({});

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [modalError, setModalError] = useState("");

  // Derived values
  const selectedZone = shippingZones.find((z) => z.id === selectedZoneId);
  const shippingFee = selectedZone?.fee ?? 0;
  const total = subtotal + shippingFee;

  const isFormValid =
    selectedZoneId &&
    country.trim() &&
    city.trim() &&
    address.trim() &&
    phone.trim().length >= 5 &&
    email.includes("@");

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!selectedZoneId) {
      newErrors.shippingZone = "Please select a shipping zone";
    }

    if (!country.trim()) {
      newErrors.country = "Country is required";
    }

    if (!city.trim()) {
      newErrors.city = "City is required";
    }

    if (!address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (phone.trim().length < 5) {
      newErrors.phone = "Phone number must be at least 5 characters";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleCheckout = async () => {
    // Double-click protection
    if (isProcessingRef.current) return;

    // Validate form first
    const validation = validateForm();
    if (!validation.isValid) {
      // Scroll to first error after state update
      setTimeout(() => {
        const errorKeys = Object.keys(validation.errors);
        if (errorKeys.length > 0) {
          const firstError = errorKeys[0];
          let elementId = "";
          if (firstError === "shippingZone") {
            elementId = "shipping-zone-select";
          } else {
            elementId = firstError;
          }
          const element = document.getElementById(elementId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            if (element instanceof HTMLElement && element.focus) {
              element.focus();
            }
          }
        }
      }, 100);
      return;
    }

    isProcessingRef.current = true;

    // Clear any previous errors
    setErrors({});

    // Show fake payment modal
    setModalStatus("processing");
    setModalOpen(true);
    setModalError("");

    try {
      // Simulate payment processing delay (fake)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await checkoutAction({
        cart_id: cartId,
        shipping_zone_id: selectedZoneId,
        address: {
          country: country.trim(),
          city: city.trim(),
          address: address.trim(),
          postal_code: postalCode.trim() || "",
        },
        phone: phone.trim(),
        email: email.trim(),
      });

      if (result.success) {
        setModalStatus("success");

        toast.success("Order placed!", {
          description: "Your order has been created successfully.",
        });

        // Short delay then redirect to cart (empty state)
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setModalOpen(false);
        router.push("/cart");
        router.refresh();
      } else {
        setModalStatus("error");
        setModalError(result.error || "Checkout failed. Please try again.");

        toast.error("Checkout failed", {
          description: result.error || "Please try again.",
        });

        // Close modal after a delay
        await new Promise((resolve) => setTimeout(resolve, 2500));
        setModalOpen(false);
      }
    } catch {
      setModalStatus("error");
      setModalError("An unexpected error occurred. Please try again.");

      toast.error("Checkout error", {
        description: "An unexpected error occurred.",
      });

      await new Promise((resolve) => setTimeout(resolve, 2500));
      setModalOpen(false);
    } finally {
      isProcessingRef.current = false;
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-black/5 bg-[#f9f9f9] dark:bg-card p-4 space-y-3">
        <h2 className="text-lg font-black tracking-tight">Order Summary</h2>

        {/* Subtotal */}
        <div className="space-y-1.5 text-sm" data-testid="subtotal-section">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium" data-testid="subtotal-amount">{formatPrice(subtotal)}</span>
          </div>
        </div>

        {/* Shipping Zone Selection */}
        <div className="space-y-2 pt-1.5 border-t border-black/5" data-testid="shipping-zone-section">
          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="shipping-zone-select" id="shipping-zone-label">
              Shipping Zone <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={selectedZoneId} 
              onValueChange={(value) => {
                setSelectedZoneId(value);
                if (errors.shippingZone) {
                  setErrors((prev) => ({ ...prev, shippingZone: undefined }));
                }
              }}
            >
              <SelectTrigger 
                className={`w-full bg-[#f9f9f9] dark:bg-card ${errors.shippingZone ? "border-destructive" : ""}`}
                id="shipping-zone-select"
                aria-labelledby="shipping-zone-label"
                data-testid="shipping-zone-select"
                aria-label="Select shipping zone"
                aria-invalid={!!errors.shippingZone}
              >
                <SelectValue placeholder="Select shipping zone" />
              </SelectTrigger>
              <SelectContent>
                {shippingZones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id} data-testid={`shipping-zone-option-${zone.id}`}>
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
            {errors.shippingZone && (
              <p className="text-xs text-destructive mt-1">{errors.shippingZone}</p>
            )}
          </div>

          {/* Shipping Fee */}
          {selectedZoneId && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  Shipping Fee
                </span>
                <span className="text-sm font-semibold">
                  {selectedZone ? formatPrice(shippingFee) : "N/A"}
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
                onChange={(e) => {
                  setCountry(e.target.value);
                  if (errors.country) {
                    setErrors((prev) => ({ ...prev, country: undefined }));
                  }
                }}
                className={`h-8 text-sm bg-[#f9f9f9] dark:bg-card ${errors.country ? "border-destructive" : ""}`}
                aria-invalid={!!errors.country}
                id="country"
              />
              {errors.country && (
                <p className="text-xs text-destructive mt-0.5">{errors.country}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="City"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  if (errors.city) {
                    setErrors((prev) => ({ ...prev, city: undefined }));
                  }
                }}
                className={`h-8 text-sm bg-[#f9f9f9] dark:bg-card ${errors.city ? "border-destructive" : ""}`}
                aria-invalid={!!errors.city}
                id="city"
              />
              {errors.city && (
                <p className="text-xs text-destructive mt-0.5">{errors.city}</p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Address <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Street address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.address) {
                  setErrors((prev) => ({ ...prev, address: undefined }));
                }
              }}
              className={`h-8 text-sm bg-[#f9f9f9] dark:bg-card ${errors.address ? "border-destructive" : ""}`}
              aria-invalid={!!errors.address}
              id="address"
            />
            {errors.address && (
              <p className="text-xs text-destructive mt-0.5">{errors.address}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Postal Code</Label>
            <Input
              placeholder="Postal code (optional)"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="h-8 text-sm bg-[#f9f9f9] dark:bg-card"
              id="postalCode"
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
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) {
                  setErrors((prev) => ({ ...prev, phone: undefined }));
                }
              }}
              className={`h-8 text-sm bg-[#f9f9f9] dark:bg-card ${errors.phone ? "border-destructive" : ""}`}
              type="tel"
              aria-invalid={!!errors.phone}
              id="phone"
            />
            {errors.phone && (
              <p className="text-xs text-destructive mt-0.5">{errors.phone}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              className={`h-8 text-sm bg-[#f9f9f9] dark:bg-card ${errors.email ? "border-destructive" : ""}`}
              type="email"
              aria-invalid={!!errors.email}
              id="email"
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-0.5">{errors.email}</p>
            )}
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
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-medium">{formatPrice(0)}</span>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-black/5 pt-2 flex justify-between items-center text-sm font-bold">
          <span>Total</span>
          <span className="text-lg">{formatPrice(total)}</span>
        </div>

        {/* Checkout Button */}
        <Button
          size="lg"
          className="w-full rounded-2xl text-sm"
          onClick={handleCheckout}
          data-testid="proceed-to-checkout-button"
          aria-label="Proceed to checkout"
          type="button"
        >
          Proceed to checkout
        </Button>
      </div>

      {/* Fake Payment Processing Modal */}
      <CheckoutModal
        open={modalOpen}
        status={modalStatus}
        errorMessage={modalError}
      />
    </>
  );
}
