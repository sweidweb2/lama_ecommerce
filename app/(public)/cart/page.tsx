import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { DUMMY_PRODUCTS } from "@/lib/constants/dummy-data";
import { CartSidebar } from "@/components/(public)/cart/CartSidebar";
import { CartItem } from "@/components/(public)/cart/CartItem";

export const metadata = {
  title: "Cart | LAMA",
  description: "View the items in your shopping cart.",
};

export default function CartPage() {
  // Frontend-only dummy cart using a few products
  const cartItems = DUMMY_PRODUCTS.slice(0, 3).map((product, index) => ({
    id: `${product.id}-cart-${index}`,
    product,
    quantity: index + 1,
  }));

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="container mx-auto px-4 py-10 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 items-start">
        {/* Left: Cart items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/5">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Your Cart
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Dummy cart filled with products from the storefront while you build
            the real cart logic.
          </p>

          <div className="space-y-4">
            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                id={item.id}
                product={item.product}
                quantity={item.quantity}
              />
            ))}
          </div>

          <div className="pt-4">
            <Link href={ROUTES.HOME}>
              <Button variant="outline" size="sm" className="rounded-xl text-xs">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-1">
          <CartSidebar subtotal={subtotal} />
        </div>
      </div>
    </div>
  );
}

