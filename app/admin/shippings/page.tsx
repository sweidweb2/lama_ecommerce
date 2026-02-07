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

// Dummy data - will be replaced with API call
const dummyShippingZones: AdminShippingZone[] = [
  {
    id: "1",
    name: "United States",
    estimated_time: "5-7 business days",
    fee: 5.99,
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    name: "Canada",
    estimated_time: "7-10 business days",
    fee: 8.99,
    created_at: "2024-01-16T09:20:00Z",
  },
  {
    id: "3",
    name: "Europe",
    estimated_time: "10-14 business days",
    fee: 12.99,
    created_at: "2024-01-16T14:45:00Z",
  },
  {
    id: "4",
    name: "Asia",
    estimated_time: "14-21 business days",
    fee: 15.99,
    created_at: "2024-01-17T08:00:00Z",
  },
]

export default function ShippingsPage() {
  const [zones, setZones] = useState<AdminShippingZone[]>(dummyShippingZones)
  const [isLoading, setIsLoading] = useState(true)

  const fetchZones = async () => {
    try {
      setIsLoading(true)
      // TODO: Replace with actual API call
      // const response = await fetch("/api/admin/shipping-zones")
      // if (response.ok) {
      //   const data = await response.json()
      //   setZones(data)
      // }
      
      // For now, use dummy data
      setZones(dummyShippingZones)
    } catch (error) {
      console.error("Error fetching shipping zones:", error)
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
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/shipping-zones/${zoneId}`, {
      //   method: "DELETE",
      // })
      // if (!response.ok) {
      //   throw new Error("Failed to delete shipping zone")
      // }
      
      // For now, just remove from local state
      setZones(zones.filter((zone) => zone.id !== zoneId))
    } catch (error) {
      console.error("Error deleting shipping zone:", error)
      throw error
    }
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
