import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { DUMMY_PRODUCTS } from "@/lib/constants/dummy-data";
import { formatPrice } from "@/lib/utils";

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
  const shipping = 15;
  const total = subtotal + shipping;

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
            {cartItems.map((item) => {
              const primaryImage =
                item.product.images?.find((img) => img.is_primary) ||
                item.product.images?.[0];
              const imageUrl =
                primaryImage?.url_image || "/placeholder-product.webp";

              return (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-2xl border border-black/5 bg-[#f9f9f9] dark:bg-card p-4"
                >
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-muted border border-border/40 shrink-0">
                    <Image
                      src={imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between gap-1">
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold line-clamp-1">
                        {item.product.name}
                      </h2>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">
                        {item.product.category?.name || "Category"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-black/10 px-2 py-1 text-[11px] font-medium">
                        Qty: {item.quantity}
                      </div>
                      <p className="text-sm font-bold">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="h-8 w-8 flex items-center justify-center rounded-full border border-black/5 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors text-xs"
                    aria-label="Remove item (dummy only)"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
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
          <div className="rounded-2xl border border-black/5 bg-[#f9f9f9] dark:bg-card p-6 space-y-4">
            <h2 className="text-lg font-black tracking-tight">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">{formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (dummy)</span>
                <span className="font-medium">{formatPrice(0)}</span>
              </div>
            </div>

            <div className="border-t border-black/5 pt-3 flex justify-between items-center text-sm font-bold">
              <span>Total</span>
              <span className="text-lg">{formatPrice(total)}</span>
            </div>

            <Button size="lg" className="w-full rounded-2xl font-black text-sm">
              Proceed to Checkout (Dummy)
            </Button>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This cart is using dummy products from{" "}
              <code className="text-[10px] px-1 py-0.5 rounded bg-black/5 dark:bg-white/5">
                DUMMY_PRODUCTS
              </code>{" "}
              so you can design and test the UI before wiring up real cart
              logic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

