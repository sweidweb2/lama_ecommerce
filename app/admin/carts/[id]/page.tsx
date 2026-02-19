import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { decryptOrderId } from "@/lib/utils/encryption";
import { getCartWithItemsForAdminService } from "@/services/cart.service";
import { CartDetailsSidebar } from "@/components/admin/cart/CartDetailsSidebar";
import { CartDetailsBreadcrumbs } from "@/components/admin/cart/CartDetailsBreadcrumbs";
import { CartItemsTable, type CartItem } from "@/components/admin/cart/CartItemsTable";
import { AddCartItemDialog } from "@/components/admin/cart/AddCartItemDialog";
import { SubmitCartButton } from "@/components/admin/cart/submit_cart_button";
import { getProfileByUserId } from "@/repositories/profile.repository";
import { notFound } from "next/navigation";
import type { CartItemWithProduct } from "@/repositories/cart_item.repository";

export default async function CartDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: encryptedId } = await params;

  // Decrypt the cart ID
  let cartId: string;
  try {
    cartId = decryptOrderId(encryptedId);
  } catch (error) {
    console.error("Failed to decrypt cart ID:", error);
    notFound();
  }

  // Fetch cart with items
  const cartResult = await getCartWithItemsForAdminService(cartId);

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

  // Transform CartItemWithProduct[] to CartItem[] for the table component
  const tableItems: CartItem[] = items.map((item: CartItemWithProduct) => ({
    id: item.id,
    cart_id: item.cart_id,
    customised_product_id: item.customised_product_id,
    quantity: item.quantity,
    created_at: item.created_at,
    product_name: item.product.name,
    color: item.color || undefined,
    size: item.size || undefined,
    material: item.material || undefined,
    price: item.product.price,
  }));

  return (
    <div>
      <CartDetailsBreadcrumbs cartId={cart.id} />
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Cart Details</h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                View and manage cart information
              </p>
            </div>
            {cart.deleted_at === null && (
              <SubmitCartButton cartId={cart.id} />
            )}
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: Cart Information */}
          <div className="lg:col-span-2">
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
                    {cart.session_id ? cart.session_id : <span className="text-muted-foreground">—</span>}
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
          </div>

          {/* Right: Summary with Form */}
          <div className="lg:col-span-1">
            <CartDetailsSidebar subtotal={subtotal} itemCount={items.length} />
          </div>
        </div>

        {/* Cart Items Table - Full Width */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart Items ({items.length})
              </CardTitle>
              <AddCartItemDialog cartId={cart.id} showText />
            </div>
          </CardHeader>
          <CardContent>
            <CartItemsTable cartId={cart.id} items={tableItems} showHeader={false} />
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}
