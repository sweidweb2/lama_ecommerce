import Link from "@/components/ui/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { CartSidebar } from "@/components/(public)/cart/CartSidebar";
import { CartItem } from "@/components/(public)/cart/CartItem";
import { PendingOrderResumeBanner } from "@/components/(public)/cart/PendingOrderResumeBanner";
import { getCurrentAuthUserFromComponent } from "@/repositories/auth.repository";
import {
  getUserCartWithItemsService,
  getGuestCartWithItemsService,
} from "@/services/cart.service";
import { getPublicShippingZones } from "@/services/shipping_zone.service";
import { getAddressesByUserId } from "@/services/address.service";
import { getGuestSessionId } from "@/lib/auth/guest-session";
import type { UserAddress } from "@/types/user";

export const metadata = {
  title: "Cart",
  description: "View the items in your shopping cart.",
};

export default async function CartPage() {
  // Check if user is authenticated
  const user = await getCurrentAuthUserFromComponent();

  // Determine cart result based on auth state
  let cartResult: Awaited<ReturnType<typeof getUserCartWithItemsService>>;

  if (user) {
    // Authenticated user → fetch cart by user_id
    cartResult = await getUserCartWithItemsService(user.id);
  } else {
    // Guest → read session cookie and fetch cart by session_id
    const sessionId = await getGuestSessionId();

    if (sessionId) {
      cartResult = await getGuestCartWithItemsService(sessionId);
    } else {
      // No session at all → show empty cart
      cartResult = { success: false, error: "No active cart found" };
    }
  }

  // If no cart or error, show empty state
  if (!cartResult.success || !cartResult.data) {
    return (
      <div className="container mx-auto px-4 pt-6 lg:pt-8 pb-0">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
          <PendingOrderResumeBanner />
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 mb-4">
            <ShoppingCart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Your Cart is Empty
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Add some items to your cart to get started.
          </p>
          <Link href={ROUTES.PRODUCTS}>
            <Button size="lg" className="rounded-xl">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { cart, items } = cartResult.data;

  // Calculate subtotal (unitPrice = COALESCE(price_override, base price))
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch shipping zones for the checkout form (fallback to empty array)
  const shippingZones = (await getPublicShippingZones()) ?? [];

  // Logged-in users: load address book for checkout prefill (null = guest)
  const savedAddresses: UserAddress[] | null = user
    ? await getAddressesByUserId(user.id)
    : null;

  return (
    <div className="container mx-auto px-4 pt-6 lg:pt-8">
      {items.length === 0 && <PendingOrderResumeBanner />}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start mb-16">
        {/* Left: Cart items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/5">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Your Cart
            </h1>
          </div>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm mb-4">
                Your cart is empty. Start adding items to your cart!
              </p>
              <Link href={ROUTES.PRODUCTS}>
                <Button variant="outline" size="sm" className="rounded-xl text-xs">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  id={item.id}
                  product={item.product}
                  quantity={item.quantity}
                  stock={item.stock}
                  unitPrice={item.unitPrice}
                />
              ))}
            </div>
          )}

          <div className="pt-2">
            <Link href={ROUTES.PRODUCTS}>
              <Button variant="outline" size="sm" className="rounded-xl text-xs">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: Order Summary + Checkout Form */}
        <div className="lg:col-span-1">
          <CartSidebar
            subtotal={subtotal}
            itemCount={itemCount}
            cartId={cart.id}
            shippingZones={shippingZones}
            savedAddresses={savedAddresses}
          />
        </div>
      </div>
    </div>
  );
}
