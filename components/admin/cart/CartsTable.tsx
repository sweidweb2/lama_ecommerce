"use client"

import { useEffect, useState, useTransition } from "react"
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
  totalCount: number
  page: number
  pageSize: number
  query: string
}

const MAX_CHARS = {
  id: 10,
  user: 24,
  session: 18,
} as const

export function CartsTable({
  carts,
  totalCount,
  page,
  pageSize,
  query,
}: CartsTableProps) {
  const router = useRouter()
  const [draftQuery, setDraftQuery] = useState(query)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setDraftQuery(query)
  }, [query])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const pushQuery = (updates: { page?: number; q?: string | null }) => {
    const params = new URLSearchParams()
    const nextQ = updates.q === undefined ? query : updates.q
    const nextPage = updates.page ?? page
    if (nextQ && nextQ.trim()) params.set("q", nextQ.trim())
    if (nextPage > 1) params.set("page", String(nextPage))
    const qs = params.toString()
    startTransition(() => {
      router.push(qs ? `/admin/carts?${qs}` : "/admin/carts")
    })
  }

  const clearFilters = () => {
    setDraftQuery("")
    pushQuery({ q: null, page: 1 })
  }

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return
    pushQuery({ page: nextPage })
  }

  const openCart = (encryptedId: string) => {
    router.push(`/admin/carts/${encryptedId}`)
  }

  const hasActiveFilters = Boolean(query.trim())

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
        onSubmit={(e) => {
          e.preventDefault()
          pushQuery({ q: draftQuery, page: 1 })
        }}
      >
        <Input
          value={draftQuery}
          onChange={(e) => setDraftQuery(e.target.value)}
          placeholder="Search cart or session ID…"
          className="max-w-sm"
          disabled={isPending}
        />
        <Button type="submit" variant="secondary" disabled={isPending}>
          Search
        </Button>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </form>

      {totalPages > 1 && (
        <PaginationBar
          currentPage={page}
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
            {carts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No carts found
                </TableCell>
              </TableRow>
            ) : (
              carts.map((cart) => {
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
                        <SubmitCartButton cartId={cart.id} />
                        <Link href={href}>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`View cart ${cart.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
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
          currentPage={page}
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
