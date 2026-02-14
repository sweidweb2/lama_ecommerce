'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { EditCartItemDialog, type CartItem } from "./EditCartItemDialog"
import { DeleteCartItemDialog } from "./DeleteCartItemDialog"
import { CreateCartItemDialog } from "./CreateCartItemDialog"
import { formatPrice } from "@/lib/utils"

export type { CartItem }

interface CartItemsTableProps {
  cartId: string
  items: CartItem[]
  showHeader?: boolean
}

export function CartItemsTable({ cartId, items, showHeader = true }: CartItemsTableProps) {
  const calculateItemTotal = (item: CartItem) => {
    const price = item.price || 0
    return price * item.quantity
  }

  const calculateCartTotal = () => {
    return items.reduce((total, item) => total + calculateItemTotal(item), 0)
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cart Items</h3>
          <CreateCartItemDialog cartId={cartId} />
        </div>
      )}

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No items in this cart
                </TableCell>
              </TableRow>
            ) : (
              <>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product_name || "Unknown Product"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.color && item.size && item.material
                        ? `${item.color} / ${item.size} / ${item.material}`
                        : "—"}
                    </TableCell>
                    <TableCell>{formatPrice(item.price || 0)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(calculateItemTotal(item))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <EditCartItemDialog cartItem={item} />
                        <DeleteCartItemDialog cartItem={item} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Total:
                  </TableCell>
                  <TableCell colSpan={2} className="font-bold text-lg">
                    {formatPrice(calculateCartTotal())}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}
