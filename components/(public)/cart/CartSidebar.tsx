"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";

interface ShippingZone {
  id: string;
  name: string;
  estimated_time: string | null;
}

interface ShippingFee {
  id: string;
  zone_id: string;
  fee: number;
}

interface CartSidebarProps {
  subtotal: number;
}

// Dummy shipping zones
const dummyShippingZones: ShippingZone[] = [
  { id: "zone-1", name: "Local (Same City)", estimated_time: "1-2 business days" },
  { id: "zone-2", name: "Domestic (Same Country)", estimated_time: "3-5 business days" },
  { id: "zone-3", name: "Regional (Nearby Countries)", estimated_time: "5-7 business days" },
  { id: "zone-4", name: "International (Standard)", estimated_time: "7-14 business days" },
  { id: "zone-5", name: "International (Express)", estimated_time: "3-5 business days" },
];

// Dummy shipping fees mapped to zones
const dummyShippingFees: ShippingFee[] = [
  { id: "fee-1", zone_id: "zone-1", fee: 5.0 },
  { id: "fee-2", zone_id: "zone-2", fee: 15.0 },
  { id: "fee-3", zone_id: "zone-3", fee: 25.0 },
  { id: "fee-4", zone_id: "zone-4", fee: 35.0 },
  { id: "fee-5", zone_id: "zone-5", fee: 50.0 },
];

export function CartSidebar({ subtotal }: CartSidebarProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [selectedFeeId, setSelectedFeeId] = useState<string>("");

  const selectedZone = dummyShippingZones.find((zone) => zone.id === selectedZoneId);
  const selectedFee = dummyShippingFees.find((fee) => fee.id === selectedFeeId);
  const shippingFee = selectedFee?.fee ?? 0;
  const total = subtotal + shippingFee;

  const handleZoneChange = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    // Automatically find and set the corresponding fee
    const fee = dummyShippingFees.find((f) => f.zone_id === zoneId);
    if (fee) {
      setSelectedFeeId(fee.id);
    } else {
      setSelectedFeeId("");
    }
  };

  const isCheckoutDisabled = !selectedZoneId;

  return (
    <div className="rounded-2xl border border-black/5 bg-[#f9f9f9] dark:bg-card p-4 space-y-3">
      <h2 className="text-lg font-black tracking-tight">Order Summary</h2>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
      </div>

      {/* Shipping Zone Selection */}
      <div className="space-y-2 pt-1.5 border-t border-black/5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Shipping Zone <span className="text-destructive">*</span>
          </label>
          <Select value={selectedZoneId} onValueChange={handleZoneChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select shipping zone" />
            </SelectTrigger>
            <SelectContent>
              {dummyShippingZones.map((zone) => (
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

        {/* Shipping Fee Display (text, auto-updates) */}
        {selectedZoneId && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">
                Shipping Fee
              </span>
              <span className="text-sm font-semibold">
                {selectedFee ? formatPrice(selectedFee.fee) : "N/A"}
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

      <div className="space-y-1.5 text-sm pt-1.5">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-medium">
            {selectedZoneId ? formatPrice(shippingFee) : formatPrice(0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax (dummy)</span>
          <span className="font-medium">{formatPrice(0)}</span>
        </div>
      </div>

      <div className="border-t border-black/5 pt-2 flex justify-between items-center text-sm font-bold">
        <span>Total</span>
        <span className="text-lg">{formatPrice(total)}</span>
      </div>

      <Button
        size="lg"
        className="w-full rounded-2xl font-black text-sm"
        disabled={isCheckoutDisabled}
      >
        {isCheckoutDisabled
          ? "Select Shipping Zone to Continue"
          : "Proceed to Checkout (Dummy)"}
      </Button>

      {isCheckoutDisabled && (
        <p className="text-xs text-muted-foreground text-center">
          Please select a shipping zone to proceed with checkout
        </p>
      )}
    </div>
  );
}
