"use client"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { useState } from "react"

// Dummy data
const promoCodes = [
  {
    id: "1",
    code: "SAVE20",
    discount: "20%",
    type: "Percentage",
    usage: 45,
    limit: 100,
    status: "Active",
    expires: "2024-12-31",
  },
  {
    id: "2",
    code: "FREESHIP",
    discount: "Free Shipping",
    type: "Fixed",
    usage: 12,
    limit: 50,
    status: "Active",
    expires: "2024-06-30",
  },
  {
    id: "3",
    code: "WELCOME10",
    discount: "10%",
    type: "Percentage",
    usage: 100,
    limit: 100,
    status: "Expired",
    expires: "2024-01-01",
  },
]

export default function PromoCodesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Promo Codes</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Create and manage promotional codes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Promo Code</DialogTitle>
              <DialogDescription>
                Add a new promotional code for your customers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" placeholder="SAVE20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount</Label>
                <Input id="discount" placeholder="20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires">Expires</Label>
                <Input id="expires" type="date" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promoCodes.map((promo) => (
              <TableRow key={promo.id}>
                <TableCell className="font-medium">{promo.code}</TableCell>
                <TableCell>{promo.discount}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {promo.type}
                  </span>
                </TableCell>
                <TableCell>
                  {promo.usage} / {promo.limit}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={promo.status === "Active" ? "default" : "secondary"}
                  >
                    {promo.status}
                  </Badge>
                </TableCell>
                <TableCell>{promo.expires}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}
