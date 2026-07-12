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
import { EditUserDialog } from "@/components/admin/user/edit_form"
import { CreateUserDialog } from "@/components/admin/user/create_from"
import { getAdminUsersAction } from "@/actions/profile"
import type { AdminUser } from "@/components/admin/user/edit_form"

function toAdminUser(row: {
  id: string
  user_id: string
  full_name: string | null
  role: string
  is_active: boolean
  email: string | null
}): AdminUser {
  return {
    id: row.id,
    name: row.full_name ?? "—",
    email: row.email ?? "—",
    role: row.role === "admin" ? "Admin" : "Customer",
    status: row.is_active ? "Active" : "Inactive",
  }
}

export default async function UsersPage() {
  const rows = await getAdminUsersAction()
  const users: AdminUser[] = rows.map(toAdminUser)

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
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No users found. Sign in as an admin to see all users.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
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
                      variant={user.status === "Active" ? "default" : "secondary"}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <EditUserDialog user={user} />
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
