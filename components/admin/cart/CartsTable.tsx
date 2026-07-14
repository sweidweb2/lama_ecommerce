"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "@/components/ui/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { DeleteCartDialog } from "@/components/admin/cart/delete_dialog"
import { SubmitCartButton } from "@/components/admin/cart/submit_cart_button"
import { ChevronLeft, ChevronRight, Eye, X } from "lucide-react"
import { cn, truncateText } from "@/lib/utils"

export type AdminCartListItem = {
  id: string
  user_id: string | null
  session_id: string | null
  created_at: string
  updated_at: string
  userName: string | null
  items: number
  total: number
  status: string
  encryptedId: string
}

interface CartsTableProps {
  carts: AdminCartListItem[]
}

const CARTS_PER_PAGE = 20
const MAX_PAGES = 100

const MAX_CHARS = {
  id: 10,
  user: 24,
  session: 18,
} as const

export function CartsTable({ carts }: CartsTableProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const statuses = useMemo(() => {
    return Array.from(new Set(carts.map((c) => c.status).filter(Boolean))).sort()
  }, [carts])

  const filteredCarts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return carts.filter((cart) => {
      const matchesStatus = statusFilter === "all" || cart.status === statusFilter
      if (!matchesStatus) return false
      if (!q) return true
      const haystack = [
        cart.id,
        cart.userName,
        cart.user_id,
        cart.session_id,
        cart.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [carts, statusFilter, query])

  const maxToShow = MAX_PAGES * CARTS_PER_PAGE
  const limited = useMemo(
    () => filteredCarts.slice(0, maxToShow),
    [filteredCarts, maxToShow],
  )

  const totalPages = Math.min(
    Math.max(1, Math.ceil(limited.length / CARTS_PER_PAGE)),
    MAX_PAGES,
  )

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * CARTS_PER_PAGE
    return limited.slice(start, start + CARTS_PER_PAGE)
  }, [limited, currentPage])

  const hasActiveFilters = statusFilter !== "all" || query.trim() !== ""

  const clearFilters = () => {
    setStatusFilter("all")
    setQuery("")
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const openCart = (encryptedId: string) => {
    router.push(`/admin/carts/${encryptedId}`)
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
          placeholder="Search user, session, or ID…"
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
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
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No carts found
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((cart) => {
                const href = `/admin/carts/${cart.encryptedId}`
                return (
                  <TableRow
                    key={cart.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openCart(cart.encryptedId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        openCart(cart.encryptedId)
                      }
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={`View cart ${cart.id}`}
                  >
                    <TableCell className="font-mono text-xs font-medium">
                      <span title={cart.id}>
                        {truncateText(cart.id, MAX_CHARS.id)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className="block max-w-[160px] truncate"
                        title={
                          cart.userName ||
                          (cart.user_id ? `User ${cart.user_id}` : undefined)
                        }
                      >
                        {truncateText(
                          cart.userName ||
                            (cart.user_id ? `User ${cart.user_id}` : null),
                          MAX_CHARS.user,
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <span
                        className="block max-w-[140px] truncate"
                        title={cart.session_id ?? undefined}
                      >
                        {truncateText(cart.session_id, MAX_CHARS.session)}
                      </span>
                    </TableCell>
                    <TableCell>{cart.items}</TableCell>
                    <TableCell>${cart.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          cart.status === "Active"
                            ? "text-green-600"
                            : cart.status === "Deleted"
                              ? "text-red-600"
                              : "text-orange-600",
                        )}
                      >
                        {cart.status}
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Link href={href}>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`View cart ${cart.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <SubmitCartButton cartId={cart.id} />
                        <DeleteCartDialog cart={cart} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
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
