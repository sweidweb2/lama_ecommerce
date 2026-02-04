import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { EditUserDialog } from "@/components/admin/user/edit_form"
import { DeleteUserDialog } from "@/components/admin/user/delete_form"
import { CreateUserDialog } from "@/components/admin/user/create_from"

// Dummy data
const users = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Customer",
    status: "Active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "Admin",
    status: "Active",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    role: "Customer",
    status: "Blocked",
  },
  {
    id: "4",
    name: "Alice Williams",
    email: "alice.williams@example.com",
    role: "Customer",
    status: "Active",
  },
  {
    id: "5",
    name: "Charlie Brown",
    email: "charlie.brown@example.com",
    role: "Customer",
    status: "Active",
  },
]

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage all users and their permissions
          </p>
        </div>
        <div className="mt-1">
          <CreateUserDialog />
        </div>
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.status === "Active" ? "default" : "destructive"}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <EditUserDialog user={user} />
                    <DeleteUserDialog user={user} />
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
