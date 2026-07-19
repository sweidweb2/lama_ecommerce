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
import { encryptOrderIdAction } from "@/actions/order";
import { CheckoutModal } from "@/components/(public)/cart/CheckoutModal";
import {
  checkoutContactSchema,
  PENDING_ORDER_DETAILS_PATH_KEY,
} from "@/lib/validators/checkout/checkout";
import type { UserAddress } from "@/types/user";

interface ShippingZoneOption {
  id: string;
  name: string;
  estimated_time: string | null;
  fee: number | null;
}

const NEW_ADDRESS_VALUE = "__new__";

function pickDefaultAddressId(addresses: UserAddress[]): string {
  const defaultAddr = addresses.find((a) => a.is_default);
  return defaultAddr?.id ?? addresses[0]?.id ?? NEW_ADDRESS_VALUE;
}

function fillFromAddress(addr: UserAddress) {
  return {
    country: addr.country ?? "",
    city: addr.city ?? "",
    address: addr.address ?? "",
    postalCode: addr.postal_code ?? "",
    phone: addr.phone ?? "",
  };
}

function addressFieldsMatch(
  addr: UserAddress,
  fields: {
    country: string;
    city: string;
    address: string;
    postalCode: string;
    phone: string;
  },
): boolean {
  return (
    (addr.country ?? "").trim() === fields.country.trim() &&
    (addr.city ?? "").trim() === fields.city.trim() &&
    (addr.address ?? "").trim() === fields.address.trim() &&
    (addr.postal_code ?? "").trim() === fields.postalCode.trim() &&
    (addr.phone ?? "").trim() === fields.phone.trim()
  );
}

interface CartSidebarProps {
  subtotal: number;
  itemCount: number;
  cartId: string;
  shippingZones: ShippingZoneOption[];
  /** null = guest; array (possibly empty) = logged-in user */
  savedAddresses?: UserAddress[] | null;
}

export function CartSidebar({
  subtotal,
  itemCount,
  cartId,
  shippingZones = [],
  savedAddresses = null,
}: CartSidebarProps) {
  const router = useRouter();
  const isProcessingRef = useRef(false);
  const isLoggedIn = savedAddresses !== null;
  const hasSavedAddresses = (savedAddresses?.length ?? 0) > 0;

  const initialAddressId =
    hasSavedAddresses && savedAddresses
      ? pickDefaultAddressId(savedAddresses)
      : NEW_ADDRESS_VALUE;
  const initialFilled =
    initialAddressId !== NEW_ADDRESS_VALUE && savedAddresses
      ? fillFromAddress(
          savedAddresses.find((a) => a.id === initialAddressId)!,
        )
      : null;

  // Shipping
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");

  // Saved address picker
  const [selectedAddressId, setSelectedAddressId] = useState<string>(initialAddressId);

  // Address
  const [country, setCountry] = useState(initialFilled?.country ?? "");
  const [city, setCity] = useState(initialFilled?.city ?? "");
  const [address, setAddress] = useState(initialFilled?.address ?? "");
  const [postalCode, setPostalCode] = useState(initialFilled?.postalCode ?? "");

  // Contact
  const [phone, setPhone] = useState(initialFilled?.phone ?? "");
  const [email, setEmail] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [promoCode, setPromoCode] = useState("");

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

  const selectedSaved =
    selectedAddressId !== NEW_ADDRESS_VALUE && savedAddresses
      ? savedAddresses.find((a) => a.id === selectedAddressId)
      : undefined;

  const fieldsMatchSelected =
    selectedSaved != null &&
    addressFieldsMatch(selectedSaved, {
      country,
      city,
      address,
      postalCode,
      phone,
    });

  const showSaveAddressCheckbox =
    isLoggedIn &&
    (!hasSavedAddresses ||
      selectedAddressId === NEW_ADDRESS_VALUE ||
      !fieldsMatchSelected);

  const applySavedAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (addressId === NEW_ADDRESS_VALUE || !savedAddresses) {
      setCountry("");
      setCity("");
      setAddress("");
      setPostalCode("");
      setPhone("");
      setSaveAddress(false);
      return;
    }
    const addr = savedAddresses.find((a) => a.id === addressId);
    if (!addr) return;
    const filled = fillFromAddress(addr);
    setCountry(filled.country);
    setCity(filled.city);
    setAddress(filled.address);
    setPostalCode(filled.postalCode);
    setPhone(filled.phone);
    setSaveAddress(false);
  };

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
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    }

    const contactResult = checkoutContactSchema.safeParse({
      phone: phone.trim(),
      email: email.trim(),
    });
    if (!contactResult.success) {
      for (const issue of contactResult.error.issues) {
        const field = issue.path[0];
        if (field === "phone" && !newErrors.phone) {
          newErrors.phone = issue.message;
        }
        if (field === "email" && !newErrors.email) {
          newErrors.email = issue.message;
        }
      }
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleCheckout = async () => {
    // Double-click protection
    if (isProcessingRef.current) return;
    if (itemCount === 0) return;

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

    // Show placing-order modal (no payment simulation)
    setModalStatus("processing");
    setModalOpen(true);
    setModalError("");

    try {
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
        save_address: showSaveAddressCheckbox && saveAddress,
        promo_code: promoCode.trim() || undefined,
      });

      if (result.success && result.orderId) {
        setModalStatus("success");

        toast.success("Order placed!", {
          description: "Your order was created. Payment status is pending.",
        });

        let orderDetailsPath: string | null = null;
        try {
          const encryptedId = await encryptOrderIdAction(result.orderId);
          orderDetailsPath = `/order_details/${encodeURIComponent(encryptedId)}`;
          sessionStorage.setItem(
            PENDING_ORDER_DETAILS_PATH_KEY,
            orderDetailsPath,
          );
        } catch (err) {
          console.error("Failed to encrypt order id for resume path:", err);
        }

        await new Promise((resolve) => setTimeout(resolve, 800));
        setModalOpen(false);
        if (orderDetailsPath) {
          router.push(orderDetailsPath);
        } else {
          router.push("/orders");
        }
        router.refresh();
      } else {
        setModalStatus("error");
        setModalError(result.error || "Could not place your order. Please try again.");

        toast.error("Order failed", {
          description: result.error || "Please try again.",
        });

        await new Promise((resolve) => setTimeout(resolve, 2500));
        setModalOpen(false);
      }
    } catch {
      setModalStatus("error");
      setModalError("An unexpected error occurred. Please try again.");

      toast.error("Order error", {
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

        {/* Promo code */}
        <div className="space-y-2 pt-1.5 border-t border-black/5">
          <Label className="text-sm font-medium" htmlFor="promo-code">
            Promo code
          </Label>
          <Input
            id="promo-code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Optional"
            className="bg-[#f9f9f9] dark:bg-card"
            autoComplete="off"
            data-testid="promo-code-input"
          />
        </div>

        {/* Address Fields */}
        <div className="space-y-2 pt-1.5 border-t border-black/5">
          <p className="text-sm font-medium">Shipping Address</p>

          {hasSavedAddresses && savedAddresses && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground" htmlFor="saved-address-select">
                Saved address
              </Label>
              <Select
                value={selectedAddressId}
                onValueChange={applySavedAddress}
              >
                <SelectTrigger
                  className="w-full bg-[#f9f9f9] dark:bg-card"
                  id="saved-address-select"
                  data-testid="saved-address-select"
                  aria-label="Select saved address"
                >
                  <SelectValue placeholder="Choose a saved address" />
                </SelectTrigger>
                <SelectContent>
                  {savedAddresses.map((addr) => (
                    <SelectItem key={addr.id} value={addr.id}>
                      {[addr.address, addr.city, addr.country]
                        .filter(Boolean)
                        .join(", ")}
                      {addr.is_default ? " (default)" : ""}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_ADDRESS_VALUE}>Enter new address</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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

          {showSaveAddressCheckbox && (
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                className="h-4 w-4 rounded border-input"
                data-testid="save-address-checkbox"
              />
              <span className="text-xs text-muted-foreground">
                Save this address to my account
              </span>
            </label>
          )}
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
        </div>

        {/* Estimated total (promo applied at place-order) */}
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

        {/* Place order */}
        <Button
          size="lg"
          className="w-full rounded-2xl text-sm"
          onClick={handleCheckout}
          disabled={itemCount === 0 || modalOpen}
          data-testid="proceed-to-checkout-button"
          aria-label="Place order"
          type="button"
        >
          Place order
        </Button>
      </div>

      {/* Placing-order modal (payment stays pending until gateway/admin) */}
      <CheckoutModal
        open={modalOpen}
        status={modalStatus}
        errorMessage={modalError}
      />
    </>
  );
}
