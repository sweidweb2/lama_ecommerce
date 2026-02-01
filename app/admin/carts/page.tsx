import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableWrapper } from "@/components/admin/table-wrapper"

// Dummy data
const carts = [
  {
    id: "1",
    userId: "user-1",
    userName: "John Doe",
    items: 3,
    total: 249.97,
    status: "Active",
  },
  {
    id: "2",
    userId: "user-2",
    userName: "Jane Smith",
    items: 1,
    total: 99.99,
    status: "Active",
  },
  {
    id: "3",
    userId: "user-3",
    userName: "Bob Johnson",
    items: 5,
    total: 549.95,
    status: "Abandoned",
  },
  {
    id: "4",
    userId: "user-4",
    userName: "Alice Williams",
    items: 2,
    total: 149.98,
    status: "Active",
  },
]

export default function CartsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Carts</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          View and manage user shopping carts
        </p>
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cart ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carts.map((cart) => (
              <TableRow key={cart.id}>
                <TableCell className="font-medium">{cart.id}</TableCell>
                <TableCell>{cart.userName}</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}
