'use client'

import { useState, useEffect, useMemo } from "react"
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
import { CreatePromoCodeDialog, type AdminPromoCode } from "@/components/admin/promo/create_form"
import { EditPromoCodeDialog } from "@/components/admin/promo/edit_form"
import { DeletePromoCodeDialog } from "@/components/admin/promo/delete_dialog"
import { getPromoCodesAction, deletePromoCodeAction } from "@/actions/promo"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight } from "lucide-react"

const formatDiscount = (promoCode: AdminPromoCode) => {
  if (promoCode.discount_type === 'percentage') {
    return `${promoCode.discount_value}%`
  }
  return `$${promoCode.discount_value?.toFixed(2)}`
}

const getStatusBadge = (promoCode: AdminPromoCode) => {
  if (!promoCode.is_active) {
    return { label: "Inactive", variant: "secondary" as const }
  }
  if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
    return { label: "Expired", variant: "secondary" as const }
  }
  if (promoCode.max_uses && promoCode.use_count >= promoCode.max_uses) {
    return { label: "Used Up", variant: "secondary" as const }
  }
  return { label: "Active", variant: "default" as const }
}

const PROMOCODES_PER_PAGE = 50
const MAX_PAGES = 50

// Helper function to truncate text with ellipsis
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<AdminPromoCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchPromoCodes = async () => {
    try {
      setIsLoading(true)
      const data = await getPromoCodesAction()
      setPromoCodes(data)
    } catch (error) {
      console.error("Error fetching promo codes:", error)
      toast.error("Failed to load promo codes")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  const handlePromoCodeCreated = () => {
    fetchPromoCodes()
  }

  const handlePromoCodeUpdated = () => {
    fetchPromoCodes()
  }

  const handlePromoCodeDeleted = async (promoCodeId: string) => {
    const result = await deletePromoCodeAction(promoCodeId)
    if (!result.success) {
      toast.error(result.error)
      throw new Error(result.error)
    }
    setPromoCodes((prev) => prev.filter((pc) => pc.id !== promoCodeId))
    toast.success("Promo code deleted")
  }

  // Calculate pagination
  const maxPromoCodesToShow = MAX_PAGES * PROMOCODES_PER_PAGE
  const limitedPromoCodes = useMemo(() => {
    return promoCodes.slice(0, maxPromoCodesToShow)
  }, [promoCodes, maxPromoCodesToShow])

  const totalPages = useMemo(() => {
    return Math.min(
      Math.ceil(limitedPromoCodes.length / PROMOCODES_PER_PAGE),
      MAX_PAGES
    )
  }, [limitedPromoCodes.length])

  // Paginate the results
  const paginatedPromoCodes = useMemo(() => {
    const startIndex = (currentPage - 1) * PROMOCODES_PER_PAGE
    const endIndex = startIndex + PROMOCODES_PER_PAGE
    return limitedPromoCodes.slice(startIndex, endIndex)
  }, [limitedPromoCodes, currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Promo Codes</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Create and manage promotional codes
          </p>
        </div>
        <CreatePromoCodeDialog onCreated={handlePromoCodeCreated} />
      </div>

      {/* Pagination - Top */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
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
                  onClick={() => handlePageChange(pageNum)}
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
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <TableWrapper isLoading={isLoading}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Code</TableHead>
              <TableHead className="w-[120px]">Discount</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[120px]">Usage</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[120px]">Expires</TableHead>
              <TableHead className="text-right w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPromoCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {promoCodes.length === 0 
                    ? "No promo codes found. Create one to get started."
                    : "No promo codes on this page."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedPromoCodes.map((promoCode) => {
                const status = getStatusBadge(promoCode)
                return (
                  <TableRow key={promoCode.id}>
                    <TableCell className="font-medium font-mono">
                      <div className="max-w-[150px] truncate" title={promoCode.code}>
                        {truncateText(promoCode.code, 20)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[120px] truncate" title={formatDiscount(promoCode)}>
                        {truncateText(formatDiscount(promoCode), 15)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[100px] truncate" title={promoCode.discount_type}>
                        <span className="text-sm text-muted-foreground capitalize">
                          {truncateText(promoCode.discount_type, 12)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[120px] truncate" title={
                        promoCode.max_uses 
                          ? `${promoCode.use_count} / ${promoCode.max_uses}`
                          : `${promoCode.use_count} (unlimited)`
                      }>
                        {truncateText(
                          promoCode.max_uses 
                            ? `${promoCode.use_count} / ${promoCode.max_uses}`
                            : `${promoCode.use_count} (unlimited)`,
                          18
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[120px] truncate" title={
                        promoCode.expires_at 
                          ? new Date(promoCode.expires_at).toLocaleDateString()
                          : "Never"
                      }>
                        {truncateText(
                          promoCode.expires_at 
                            ? new Date(promoCode.expires_at).toLocaleDateString()
                            : "Never",
                          15
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EditPromoCodeDialog promoCode={promoCode} onUpdated={handlePromoCodeUpdated} />
                        <DeletePromoCodeDialog 
                          promoCode={{ id: promoCode.id, code: promoCode.code }}
                          onDelete={handlePromoCodeDeleted}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      {/* Pagination - Bottom */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
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
                  onClick={() => handlePageChange(pageNum)}
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
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
