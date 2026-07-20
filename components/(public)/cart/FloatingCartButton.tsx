"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { getUserCartWithItemsAction } from "@/actions/cart";
import { useAuth } from "@/providers/AuthProvider";
import { ROLES } from "@/lib/constants/roles";
import type { CartItemWithProduct } from "@/repositories/cart_item.repository";


export function FloatingCartButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuth();
  const isAdmin = role === ROLES.ADMIN;
  const [cartData, setCartData] = useState<{
    itemCount: number;
    total: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    if (isAdmin) {
      setCartData(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const result = await getUserCartWithItemsAction();
      if (result.success && result.data) {
        const { items } = result.data;
        const itemCount = items.reduce((sum: number, item: CartItemWithProduct) => sum + item.quantity, 0);
        const total = items.reduce(
          (sum: number, item: CartItemWithProduct) =>
            sum + item.unitPrice * item.quantity,
          0
        );
        setCartData({ itemCount, total });
      } else {
        setCartData(null);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCartData(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Initial fetch
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Refresh cart when pathname changes or when cart is updated
  useEffect(() => {
    if (pathname === "/cart" || isAdmin) return;

    fetchCart();

    // Listen for cart update events
    const handleCartUpdate = () => {
      fetchCart();
    };
    window.addEventListener("cart-updated", handleCartUpdate);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, [pathname, fetchCart, isAdmin]);

  // Don't show for admins or on cart page
  if (isAdmin || pathname === "/cart") {
    return null;
  }

  // Don't show while loading
  if (isLoading) {
    return null;
  }

  const itemCount = cartData?.itemCount || 0;

  // Only show when there are items
  if (!cartData || itemCount === 0) {
    return null;
  }

  return (
    <Button
      onClick={() => router.push("/cart")}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 h-12 sm:h-14 px-4 sm:px-5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
      aria-label="View cart"
    >
      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
      <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
        {formatPrice(cartData.total)}
      </span>
    </Button>
  );
}
