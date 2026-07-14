import { CreateUserDialog } from "@/components/admin/user/create_from"
import { UsersTable } from "@/components/admin/user/UsersTable"
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

      <UsersTable users={users} />
    </div>
  )
}
