import { CreateUserDialog } from "@/components/admin/user/create_from"
import { UsersTable } from "@/components/admin/user/UsersTable"
import { getAdminUsersPageAction } from "@/actions/profile"
import type { AdminUser } from "@/components/admin/user/edit_form"
import {
  ADMIN_USERS_PAGE_SIZE,
  parseAdminUsersListParams,
} from "@/lib/admin/users-list-params"

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

interface UsersPageProps {
  searchParams: Promise<{
    page?: string
    q?: string
    role?: string
    status?: string
  }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams
  const listParams = parseAdminUsersListParams(params, ADMIN_USERS_PAGE_SIZE)
  const { items, total } = await getAdminUsersPageAction(listParams)
  const users: AdminUser[] = items.map(toAdminUser)

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

      <UsersTable
        users={users}
        totalCount={total}
        page={listParams.page}
        pageSize={listParams.pageSize}
      />
    </div>
  )
}
