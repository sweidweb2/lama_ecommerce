import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CartDetailsBreadcrumbs } from '@/components/admin/cart/CartDetailsBreadcrumbs'
import { EditCartDialog, type AdminCart } from '@/components/admin/cart/edit_form'
import { DeleteCartDialog } from '@/components/admin/cart/delete_dialog'
import { CartItemsTable, type CartItem } from '@/components/admin/cart/CartItemsTable'
import { formatPrice } from '@/lib/utils'

interface CartDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

// Dummy users for display
const DUMMY_USERS = [
  { id: "1", name: "John Doe", email: "john.doe@example.com" },
  { id: "2", name: "Jane Smith", email: "jane.smith@example.com" },
  { id: "3", name: "Bob Johnson", email: "bob.johnson@example.com" },
  { id: "4", name: "Alice Williams", email: "alice.williams@example.com" },
  { id: "5", name: "Charlie Brown", email: "charlie.brown@example.com" },
]

export default async function CartDetailsPage({ params }: CartDetailsPageProps) {
  const { id } = await params

  // Dummy cart data - in a real app, fetch from database
  const cart: AdminCart & { userName?: string } = {
    id: id,
    user_id: "1",
    session_id: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    deleted_at: null,
    userName: "John Doe",
  }

  // Dummy cart items - in a real app, fetch from database
  const cartItems: CartItem[] = [
    {
      id: "cart-item-1",
      cart_id: id,
      customised_product_id: "variant-1",
      quantity: 2,
      created_at: new Date().toISOString(),
      deleted_at: null,
      product_name: "Tech Pro Station",
      color: "Black",
      size: "M",
      material: "Cotton",
      price: 999.99,
    },
    {
      id: "cart-item-2",
      cart_id: id,
      customised_product_id: "variant-2",
      quantity: 1,
      created_at: new Date().toISOString(),
      deleted_at: null,
      product_name: "Wireless Headphones",
      color: "White",
      size: "L",
      material: "Plastic",
      price: 299.99,
    },
    {
      id: "cart-item-3",
      cart_id: id,
      customised_product_id: "variant-3",
      quantity: 3,
      created_at: new Date().toISOString(),
      deleted_at: null,
      product_name: "Classic T-Shirt",
      color: "Red",
      size: "S",
      material: "Cotton",
      price: 29.99,
    },
  ]

  const user = cart.user_id ? DUMMY_USERS.find((u) => u.id === cart.user_id) : null

  // Calculate cart totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)

  return (
    <div>
      <CartDetailsBreadcrumbs cartId={cart.id} />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Cart Details</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              View and manage cart information
            </p>
          </div>
          <div className="flex gap-2">
            <EditCartDialog cart={cart} showText />
            <DeleteCartDialog cart={cart} showText />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <Card>
              <CardHeader>
                <CardTitle>Cart Items</CardTitle>
              </CardHeader>
              <CardContent>
                <CartItemsTable cartId={cart.id} items={cartItems} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Cart Information */}
          <div className="space-y-6">
            {/* Cart Information */}
            <Card>
              <CardHeader>
                <CardTitle>Cart Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cart ID</label>
                  <p className="text-sm font-mono mt-1">{cart.id}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">User</label>
                  {user ? (
                    <div className="mt-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  ) : cart.user_id ? (
                    <p className="text-sm mt-1">User ID: {cart.user_id}</p>
                  ) : (
                    <p className="text-sm mt-1 text-muted-foreground">Guest</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Session ID</label>
                  <p className="text-sm font-mono mt-1">
                    {cart.session_id || <span className="text-muted-foreground">—</span>}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="text-sm mt-1">
                    {cart.created_at
                      ? new Date(cart.created_at).toLocaleString()
                      : "—"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                  <p className="text-sm mt-1">
                    {cart.updated_at
                      ? new Date(cart.updated_at).toLocaleString()
                      : "—"}
                  </p>
                </div>

                {cart.deleted_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Deleted At</label>
                    <p className="text-sm mt-1">
                      {new Date(cart.deleted_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cart Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Cart Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{cartItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">{formatPrice(subtotal)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
