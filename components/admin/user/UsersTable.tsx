"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { AdminUrlPagination } from "@/components/admin/product/AdminUrlPagination"
import { EditUserDialog, type AdminUser } from "@/components/admin/user/edit_form"
import { X } from "lucide-react"
import { truncateText } from "@/lib/utils"
import { ADMIN_USERS_PAGE_SIZE } from "@/lib/admin/users-list-params"

const MAX_CHARS = {
  name: 28,
  email: 32,
} as const

interface UsersTableProps {
  users: AdminUser[]
  totalCount: number
  page: number
  pageSize?: number
}

export function UsersTable({
  users,
  totalCount,
  page,
  pageSize = ADMIN_USERS_PAGE_SIZE,
}: UsersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const qParam = searchParams.get("q") ?? ""
  const roleFilter = searchParams.get("role") || "all"
  const statusFilter = searchParams.get("status") || "all"

  const [queryDraft, setQueryDraft] = useState(qParam)

  useEffect(() => {
    setQueryDraft(qParam)
  }, [qParam])

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString())
    mutate(params)
    const query = params.toString()
    router.push(query ? `/admin/users?${query}` : "/admin/users")
  }

  const setFilter = (name: string, value: string) => {
    pushParams((params) => {
      if (value === "all" || value === "") {
        params.delete(name)
      } else {
        params.set(name, value)
      }
      params.delete("page")
    })
  }

  const applySearch = () => {
    pushParams((params) => {
      const trimmed = queryDraft.trim()
      if (!trimmed) params.delete("q")
      else params.set("q", trimmed)
      params.delete("page")
    })
  }

  const hasActiveFilters =
    roleFilter !== "all" || statusFilter !== "all" || qParam.trim() !== ""

  const clearFilters = () => {
    setQueryDraft("")
    router.push("/admin/users")
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1)
  const showingStart = users.length > 0 ? (page - 1) * pageSize + 1 : 0
  const showingEnd = (page - 1) * pageSize + users.length

  // Map URL role (admin/user) to display filter values used in Select
  const roleSelectValue =
    roleFilter === "admin"
      ? "Admin"
      : roleFilter === "user"
        ? "Customer"
        : "all"

  const statusSelectValue =
    statusFilter === "active"
      ? "Active"
      : statusFilter === "inactive"
        ? "Inactive"
        : "all"

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <form
          className="flex gap-2 max-w-sm w-full"
          onSubmit={(e) => {
            e.preventDefault()
            applySearch()
          }}
        >
          <Input
            value={queryDraft}
            onChange={(e) => setQueryDraft(e.target.value)}
            placeholder="Search name or email…"
            className="flex-1"
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
        <Select
          value={roleSelectValue}
          onValueChange={(value) => {
            if (value === "Admin") setFilter("role", "admin")
            else if (value === "Customer") setFilter("role", "user")
            else setFilter("role", "all")
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Customer">Customer</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusSelectValue}
          onValueChange={(value) => {
            if (value === "Active") setFilter("status", "active")
            else if (value === "Inactive") setFilter("status", "inactive")
            else setFilter("status", "all")
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-medium">{showingStart}</span> to{" "}
        <span className="font-medium">{showingEnd}</span> of{" "}
        <span className="font-medium">{totalCount}</span> users
      </p>

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
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  {totalCount === 0 && !hasActiveFilters
                    ? "No users found. Sign in as an admin to see all users."
                    : "No users match these filters."}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <span
                      className="block max-w-[200px] truncate"
                      title={user.name}
                    >
                      {truncateText(user.name, MAX_CHARS.name)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className="block max-w-[240px] truncate"
                      title={user.email}
                    >
                      {truncateText(user.email, MAX_CHARS.email)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "Admin" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === "Active" ? "default" : "secondary"
                      }
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

      <AdminUrlPagination totalPages={totalPages} basePath="/admin/users" />
    </div>
  )
}
