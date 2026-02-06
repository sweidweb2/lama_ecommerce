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

// Dummy data matching the schema
const carts: (AdminCart & { userName?: string; items: number; total: number; status: string })[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    user_id: "1",
    session_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    userName: "John Doe",
    items: 3,
    total: 249.97,
    status: "Active",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    user_id: "2",
    session_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    userName: "Jane Smith",
    items: 1,
    total: 99.99,
    status: "Active",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    user_id: null,
    session_id: "session-abc123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    userName: "Guest",
    items: 5,
    total: 549.95,
    status: "Abandoned",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    user_id: "4",
    session_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    userName: "Alice Williams",
    items: 2,
    total: 149.98,
    status: "Active",
  },
]

export default function CartsPage() {
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
            {carts.map((cart) => (
              <TableRow key={cart.id}>
                <TableCell className="font-medium font-mono text-xs">
                  <Link
                    href={`/admin/carts/${cart.id}`}
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
                        : "text-orange-600"
                    }`}
                  >
                    {cart.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/carts/${cart.id}`}>
                      <Button variant="ghost" size="icon" aria-label={`View cart ${cart.id}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <EditCartDialog cart={cart} />
                    <DeleteCartDialog cart={cart} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}
