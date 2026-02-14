import Link from "next/link";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { getCartWithItemsForAdminService } from "@/services/cart.service";
import { CartDetailsSidebar } from "@/components/admin/cart/CartDetailsSidebar";
import { CartItem } from "@/components/(public)/cart/CartItem";
import { getProfileByUserId } from "@/repositories/profile.repository";

export default async function CartDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch cart with items
  const cartResult = await getCartWithItemsForAdminService(id);

  if (!cartResult.success || !cartResult.data) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Cart Details</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              View and manage cart information
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {cartResult.error || "Cart not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { cart, items } = cartResult.data;

  // Get user profile if user_id exists
  const profile = cart.user_id
    ? await getProfileByUserId(cart.user_id)
    : null;

  // Calculate subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/carts">
              <Button variant="ghost" size="icon" aria-label="Back to carts">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Cart Details</h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                View and manage cart information
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Cart Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Cart ID
                  </label>
                  <p className="text-sm font-mono mt-1">{cart.id}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    User
                  </label>
                  {profile ? (
                    <div className="mt-1">
                      <p className="text-sm font-medium">{profile.full_name || "Unknown"}</p>
                      {cart.user_id && (
                        <p className="text-xs text-muted-foreground">
                          User ID: {cart.user_id}
                        </p>
                      )}
                    </div>
                  ) : cart.user_id ? (
                    <p className="text-sm mt-1">User ID: {cart.user_id}</p>
                  ) : (
                    <p className="text-sm mt-1 text-muted-foreground">Guest</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Session ID
                  </label>
                  <p className="text-sm font-mono mt-1">
                    {cart.session_id || <span className="text-muted-foreground">—</span>}
                  </p>
                </div>

                <div className="flex gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Created At
                    </label>
                    <p className="text-sm mt-1">
                      {cart.created_at
                        ? new Date(cart.created_at).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Updated At
                    </label>
                    <p className="text-sm mt-1">
                      {cart.updated_at
                        ? new Date(cart.updated_at).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </div>

                {cart.deleted_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Deleted At
                    </label>
                    <p className="text-sm mt-1">
                      {new Date(cart.deleted_at).toLocaleString()}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      variant={cart.deleted_at ? "destructive" : "default"}
                    >
                      {cart.deleted_at ? "Deleted" : "Active"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cart Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart Items ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">
                      No items in this cart
                    </p>
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
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Summary with Form */}
          <div className="lg:col-span-1">
            <CartDetailsSidebar subtotal={subtotal} />
          </div>
        </div>
      </div>
    </div>
  );
}
