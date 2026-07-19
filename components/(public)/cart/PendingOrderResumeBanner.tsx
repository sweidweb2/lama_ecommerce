"use client";

import { useEffect, useState } from "react";
import Link from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { PENDING_ORDER_DETAILS_PATH_KEY } from "@/lib/validators/checkout/checkout";

/**
 * Shows when checkout succeeded but the user may have missed the redirect
 * (e.g. navigated away mid-flow). Path is stored in sessionStorage by CartSidebar.
 */
export function PendingOrderResumeBanner() {
  const [orderPath, setOrderPath] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(PENDING_ORDER_DETAILS_PATH_KEY);
      if (stored && stored.startsWith("/order_details/")) {
        setOrderPath(stored);
      }
    } catch {
      // sessionStorage unavailable — no banner
    }
  }, []);

  const clearPending = () => {
    try {
      sessionStorage.removeItem(PENDING_ORDER_DETAILS_PATH_KEY);
    } catch {
      // ignore
    }
    setOrderPath(null);
  };

  if (!orderPath) return null;

  return (
    <div
      className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left"
      role="status"
      data-testid="pending-order-resume-banner"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          Your order was placed
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          You can continue to your order details if you left during checkout.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button asChild size="sm" className="rounded-xl" onClick={clearPending}>
          <Link href={orderPath}>View order</Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          aria-label="Dismiss"
          onClick={clearPending}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
