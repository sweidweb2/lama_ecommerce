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
import { Plus, Edit } from "lucide-react"

// Dummy data
const shippingZones = [
  {
    id: "1",
    name: "United States",
    countries: ["US"],
    fee: 5.99,
    freeThreshold: 50,
    status: "Active",
  },
  {
    id: "2",
    name: "Canada",
    countries: ["CA"],
    fee: 8.99,
    freeThreshold: 75,
    status: "Active",
  },
  {
    id: "3",
    name: "Europe",
    countries: ["GB", "FR", "DE", "IT"],
    fee: 12.99,
    freeThreshold: 100,
    status: "Active",
  },
  {
    id: "4",
    name: "Asia",
    countries: ["JP", "CN", "KR"],
    fee: 15.99,
    freeThreshold: 150,
    status: "Active",
  },
]

export default function ShippingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Shippings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage shipping zones and fees
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Shipping Zone
        </Button>
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone Name</TableHead>
              <TableHead>Countries</TableHead>
              <TableHead>Shipping Fee</TableHead>
              <TableHead>Free Threshold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shippingZones.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell className="font-medium">{zone.name}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {zone.countries.join(", ")}
                  </span>
                </TableCell>
                <TableCell>${zone.fee.toFixed(2)}</TableCell>
                <TableCell>${zone.freeThreshold.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={zone.status === "Active" ? "default" : "secondary"}>
                    {zone.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}
