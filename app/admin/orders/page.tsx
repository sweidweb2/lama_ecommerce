import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TableWrapper } from "@/components/admin/table-wrapper"

// Dummy data
const orders = [
  {
    id: "ORD-001",
    user: "John Doe",
    amount: 249.97,
    status: "Completed",
    date: "2024-01-15",
  },
  {
    id: "ORD-002",
    user: "Jane Smith",
    amount: 99.99,
    status: "Pending",
    date: "2024-01-16",
  },
  {
    id: "ORD-003",
    user: "Bob Johnson",
    amount: 549.95,
    status: "Processing",
    date: "2024-01-16",
  },
  {
    id: "ORD-004",
    user: "Alice Williams",
    amount: 149.98,
    status: "Shipped",
    date: "2024-01-17",
  },
  {
    id: "ORD-005",
    user: "Charlie Brown",
    amount: 79.99,
    status: "Cancelled",
    date: "2024-01-17",
  },
]

const getStatusVariant = (status: string) => {
  switch (status) {
    case "Completed":
      return "default"
    case "Pending":
      return "secondary"
    case "Processing":
      return "secondary"
    case "Shipped":
      return "default"
    case "Cancelled":
      return "destructive"
    default:
      return "secondary"
  }
}

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage and track all orders
        </p>
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.user}</TableCell>
                <TableCell>${order.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>{order.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}
