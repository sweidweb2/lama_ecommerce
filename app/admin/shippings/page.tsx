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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { CreateShippingZoneDialog, type AdminShippingZone } from "@/components/admin/shipping/create_form"
import { EditShippingZoneDialog } from "@/components/admin/shipping/edit_form"
import { DeleteShippingZoneDialog } from "@/components/admin/shipping/delete_dialog"
import { getShippingZonesAction, deleteShippingZoneAction } from "@/actions/shipping"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { truncateText } from "@/lib/utils"

const ZONES_PER_PAGE = 20
const MAX_PAGES = 100

const MAX_CHARS = {
  name: 28,
  estimatedTime: 24,
  fee: 12,
} as const

export default function ShippingsPage() {
  const [zones, setZones] = useState<AdminShippingZone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const fetchZones = async () => {
    try {
      setIsLoading(true)
      const data = await getShippingZonesAction()
      setZones(data)
    } catch (error) {
      console.error("Error fetching shipping zones:", error)
      toast.error("Failed to load shipping zones")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchZones()
  }, [])

  const handleZoneCreated = () => {
    fetchZones()
  }

  const handleZoneUpdated = () => {
    fetchZones()
  }

  const handleZoneDeleted = async (zoneId: string) => {
    const result = await deleteShippingZoneAction(zoneId)
    if (!result.success) {
      toast.error(result.error)
      throw new Error(result.error)
    }
    setZones((prev) => prev.filter((z) => z.id !== zoneId))
    toast.success("Shipping zone deleted")
  }

  const filteredZones = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return zones
    return zones.filter((zone) => {
      const haystack = [zone.name, zone.estimated_time, zone.fee?.toString()]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [zones, query])

  const maxZonesToShow = MAX_PAGES * ZONES_PER_PAGE
  const limitedZones = useMemo(
    () => filteredZones.slice(0, maxZonesToShow),
    [filteredZones, maxZonesToShow],
  )

  const totalPages = Math.min(
    Math.max(1, Math.ceil(limitedZones.length / ZONES_PER_PAGE)),
    MAX_PAGES,
  )

  const paginatedZones = useMemo(() => {
    const start = (currentPage - 1) * ZONES_PER_PAGE
    return limitedZones.slice(start, start + ZONES_PER_PAGE)
  }, [limitedZones, currentPage])

  const hasActiveFilters = query.trim() !== ""

  const clearFilters = () => {
    setQuery("")
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Shippings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage shipping zones and fees
          </p>
        </div>
        <CreateShippingZoneDialog onCreated={handleZoneCreated} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setCurrentPage(1)
          }}
          placeholder="Search by name or time…"
          className="max-w-sm"
        />
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

      <TableWrapper isLoading={isLoading}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone Name</TableHead>
              <TableHead>Estimated Time</TableHead>
              <TableHead>Shipping Fee</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedZones.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  {zones.length === 0
                    ? "No shipping zones found. Create one to get started."
                    : "No shipping zones match this search."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedZones.map((zone) => {
                const feeLabel =
                  zone.fee !== null ? `$${zone.fee.toFixed(2)}` : "—"
                return (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">
                      <span
                        className="block max-w-[200px] truncate"
                        title={zone.name}
                      >
                        {truncateText(zone.name, MAX_CHARS.name)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className="block max-w-[180px] truncate text-sm text-muted-foreground"
                        title={zone.estimated_time ?? undefined}
                      >
                        {truncateText(
                          zone.estimated_time,
                          MAX_CHARS.estimatedTime,
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span title={feeLabel}>
                        {truncateText(feeLabel, MAX_CHARS.fee)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EditShippingZoneDialog
                          zone={zone}
                          onUpdated={handleZoneUpdated}
                        />
                        <DeleteShippingZoneDialog
                          zone={{ id: zone.id, name: zone.name }}
                          onDelete={handleZoneDeleted}
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
