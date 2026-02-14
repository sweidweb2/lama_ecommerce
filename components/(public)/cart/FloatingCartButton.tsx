"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { getUserCartWithItemsAction } from "@/actions/cart";
import { useAuth } from "@/providers/AuthProvider";


export function FloatingCartButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const [cartData, setCartData] = useState<{
    itemCount: number;
    total: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    
    if (!user) {
      setCartData(null);
      setIsLoading(false);
      return;
    }

    const fetchCart = async () => {
      try {
        setIsLoading(true);
        const result = await getUserCartWithItemsAction();
        if (result.success && result.data) {
          const { items } = result.data;
          const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
          const total = items.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
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
    };

    fetchCart();
  }, [user, authLoading]);

  // Refresh cart when pathname changes or when cart is updated
  useEffect(() => {
    if (authLoading || !user || pathname === "/cart") return;

    const fetchCart = async () => {
      try {
        const result = await getUserCartWithItemsAction();
        if (result.success && result.data) {
          const { items } = result.data;
          const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
          const total = items.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );
          setCartData({ itemCount, total });
        } else {
          setCartData(null);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    };

    fetchCart();

    // Listen for cart update events
    const handleCartUpdate = () => {
      fetchCart();
    };
    window.addEventListener("cart-updated", handleCartUpdate);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, [pathname, user, authLoading]);

  // Don't show if on cart page
  if (pathname === "/cart") {
    return null;
  }

  // Don't show if loading or not logged in
  if (isLoading || !user) {
    return null;
  }

  // Show button even if no cart data (will show 0 items)
  // This helps with debugging and ensures button appears when cart is created
  const itemCount = cartData?.itemCount || 0;
  const total = cartData?.total || 0;

  // Only hide if explicitly no items (but still show if cart exists with 0 items for now)
  // Actually, let's show it only when there are items
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
