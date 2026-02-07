'use client'

import { useState, useEffect } from "react"
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
import { CreatePromoCodeDialog, type AdminPromoCode } from "@/components/admin/promo/create_form"
import { EditPromoCodeDialog } from "@/components/admin/promo/edit_form"
import { DeletePromoCodeDialog } from "@/components/admin/promo/delete_dialog"

// Dummy data - will be replaced with API call
const dummyPromoCodes: AdminPromoCode[] = [
  {
    id: "1",
    code: "SAVE20",
    discount_type: "percentage",
    discount_value: 20,
    max_uses: 100,
    use_count: 45,
    is_active: true,
    expires_at: "2024-12-31T23:59:59Z",
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    code: "FREESHIP",
    discount_type: "fixed",
    discount_value: 10,
    max_uses: 50,
    use_count: 12,
    is_active: true,
    expires_at: "2024-06-30T23:59:59Z",
    created_at: "2024-01-16T09:20:00Z",
  },
  {
    id: "3",
    code: "WELCOME10",
    discount_type: "percentage",
    discount_value: 10,
    max_uses: 100,
    use_count: 100,
    is_active: false,
    expires_at: "2024-01-01T23:59:59Z",
    created_at: "2024-01-10T08:00:00Z",
  },
]

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

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<AdminPromoCode[]>(dummyPromoCodes)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPromoCodes = async () => {
    try {
      setIsLoading(true)
      // TODO: Replace with actual API call
      // const response = await fetch("/api/admin/promo-codes")
      // if (response.ok) {
      //   const data = await response.json()
      //   setPromoCodes(data)
      // }
      
      // For now, use dummy data
      setPromoCodes(dummyPromoCodes)
    } catch (error) {
      console.error("Error fetching promo codes:", error)
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
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/promo-codes/${promoCodeId}`, {
      //   method: "DELETE",
      // })
      // if (!response.ok) {
      //   throw new Error("Failed to delete promo code")
      // }
      
      // For now, just remove from local state
      setPromoCodes(promoCodes.filter((pc) => pc.id !== promoCodeId))
    } catch (error) {
      console.error("Error deleting promo code:", error)
      throw error
    }
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

      <TableWrapper isLoading={isLoading}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promoCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No promo codes found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              promoCodes.map((promoCode) => {
                const status = getStatusBadge(promoCode)
                return (
                  <TableRow key={promoCode.id}>
                    <TableCell className="font-medium font-mono">{promoCode.code}</TableCell>
                    <TableCell>{formatDiscount(promoCode)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground capitalize">
                        {promoCode.discount_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {promoCode.max_uses 
                        ? `${promoCode.use_count} / ${promoCode.max_uses}`
                        : `${promoCode.use_count} (unlimited)`
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {promoCode.expires_at 
                        ? new Date(promoCode.expires_at).toLocaleDateString()
                        : "Never"
                      }
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
    </div>
  )
}
