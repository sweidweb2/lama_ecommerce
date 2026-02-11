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
import { TableWrapper } from "@/components/admin/table-wrapper"
import { CreateShippingZoneDialog, type AdminShippingZone } from "@/components/admin/shipping/create_form"
import { EditShippingZoneDialog } from "@/components/admin/shipping/edit_form"
import { DeleteShippingZoneDialog } from "@/components/admin/shipping/delete_dialog"
import { getShippingZonesAction, deleteShippingZoneAction } from "@/actions/shipping"
import { toast } from "sonner"

export default function ShippingsPage() {
  const [zones, setZones] = useState<AdminShippingZone[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
            {zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No shipping zones found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.name}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {zone.estimated_time || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {zone.fee !== null ? `$${zone.fee.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <EditShippingZoneDialog zone={zone} onUpdated={handleZoneUpdated} />
                      <DeleteShippingZoneDialog 
                        zone={{ id: zone.id, name: zone.name }}
                        onDelete={handleZoneDeleted}
                      />
                    </div>
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
