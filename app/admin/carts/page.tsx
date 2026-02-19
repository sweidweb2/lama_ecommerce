import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { CreateCartDialog } from "@/components/admin/cart/create_form"
import { EditCartDialog, type AdminCart } from "@/components/admin/cart/edit_form"
import { DeleteCartDialog } from "@/components/admin/cart/delete_dialog"
import { Eye } from "lucide-react"
import { getAllCartsForAdminService } from "@/services/cart.service"
import { SubmitCartButton } from "@/components/admin/cart/submit_cart_button"
import { encryptOrderId } from "@/lib/utils/encryption"

export default async function CartsPage() {
  // Fetch real cart data
  const carts = await getAllCartsForAdminService()
  
  // Encrypt cart IDs on the server side
  const cartsWithEncryptedIds = carts.map(cart => ({
    ...cart,
    encryptedId: encryptOrderId(cart.id), // Reusing the same encryption function
  }))
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Carts</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            View and manage user shopping carts
          </p>
        </div>
        <CreateCartDialog />
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cart ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Session ID</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No carts found
                </TableCell>
              </TableRow>
            ) : (
              cartsWithEncryptedIds.map((cart) => (
                <TableRow key={cart.id}>
                  <TableCell className="font-medium font-mono text-xs">
                    <Link
                      href={`/admin/carts/${(cart as any).encryptedId}`}
                      className="hover:text-primary hover:underline transition-colors"
                    >
                      {cart.id.slice(0, 8)}...
                    </Link>
                  </TableCell>
                  <TableCell>
                    {cart.userName || (cart.user_id ? `User ${cart.user_id}` : "—")}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {cart.session_id || "—"}
                  </TableCell>
                  <TableCell>{cart.items}</TableCell>
                  <TableCell>${cart.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-medium ${
                        cart.status === "Active"
                          ? "text-green-600"
                          : cart.status === "Deleted"
                          ? "text-red-600"
                          : "text-orange-600"
                      }`}
                    >
                      {cart.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/carts/${(cart as any).encryptedId}`}>
                        <Button variant="ghost" size="icon" aria-label={`View cart ${cart.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {cart.deleted_at === null && (
                        <>
                          <SubmitCartButton cartId={cart.id} />
                          <DeleteCartDialog cart={cart} />
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}
