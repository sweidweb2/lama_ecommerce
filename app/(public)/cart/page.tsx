import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

export const metadata = {
  title: "Cart | LAMA",
  description: "View the items in your shopping cart.",
};

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 mb-4">
          <ShoppingCart className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Your cart is empty
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          When you add products to your cart, they&apos;ll show up here so you
          can review them before checkout.
        </p>
        <div className="flex justify-center pt-4">
          <Link href={ROUTES.HOME}>
            <Button size="lg" className="rounded-xl">
              Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

