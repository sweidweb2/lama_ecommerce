"use client"

import { useMemo, useState } from "react"
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
import { EditUserDialog, type AdminUser } from "@/components/admin/user/edit_form"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { truncateText } from "@/lib/utils"

const USERS_PER_PAGE = 20
const MAX_PAGES = 100

const MAX_CHARS = {
  name: 28,
  email: 32,
} as const

interface UsersTableProps {
  users: AdminUser[]
}

export function UsersTable({ users }: UsersTableProps) {
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      const matchesStatus = statusFilter === "all" || user.status === statusFilter
      if (!matchesRole || !matchesStatus) return false
      if (!q) return true
      return (
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q)
      )
    })
  }, [users, query, roleFilter, statusFilter])

  const maxToShow = MAX_PAGES * USERS_PER_PAGE
  const limited = useMemo(
    () => filteredUsers.slice(0, maxToShow),
    [filteredUsers, maxToShow],
  )

  const totalPages = Math.min(
    Math.max(1, Math.ceil(limited.length / USERS_PER_PAGE)),
    MAX_PAGES,
  )

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE
    return limited.slice(start, start + USERS_PER_PAGE)
  }, [limited, currentPage])

  const hasActiveFilters =
    roleFilter !== "all" || statusFilter !== "all" || query.trim() !== ""

  const clearFilters = () => {
    setQuery("")
    setRoleFilter("all")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setCurrentPage(1)
          }}
          placeholder="Search name or email…"
          className="max-w-sm"
        />
        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value)
            setCurrentPage(1)
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
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value)
            setCurrentPage(1)
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

      {totalPages > 1 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

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
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  {users.length === 0
                    ? "No users found. Sign in as an admin to see all users."
                    : "No users match these filters."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((user) => (
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

      {totalPages > 1 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}

function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
          let pageNum: number
          if (totalPages <= 10) {
            pageNum = i + 1
          } else if (currentPage <= 5) {
            pageNum = i + 1
          } else if (currentPage >= totalPages - 4) {
            pageNum = totalPages - 9 + i
          } else {
            pageNum = currentPage - 5 + i
          }
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className="w-10"
            >
              {pageNum}
            </Button>
          )
        })}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
