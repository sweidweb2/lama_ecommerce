import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { Download, Database } from "lucide-react"

// Dummy data
const backups = [
  {
    id: "1",
    name: "Full Backup - 2024-01-17",
    type: "Full",
    size: "2.5 GB",
    timestamp: "2024-01-17 10:30:00",
  },
  {
    id: "2",
    name: "Incremental Backup - 2024-01-16",
    type: "Incremental",
    size: "450 MB",
    timestamp: "2024-01-16 10:30:00",
  },
  {
    id: "3",
    name: "Full Backup - 2024-01-15",
    type: "Full",
    size: "2.3 GB",
    timestamp: "2024-01-15 10:30:00",
  },
  {
    id: "4",
    name: "Incremental Backup - 2024-01-14",
    type: "Incremental",
    size: "380 MB",
    timestamp: "2024-01-14 10:30:00",
  },
]

export default function BackupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Backups</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage database backups and restore points
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <Database className="mr-2 h-4 w-4" />
          Create Backup
        </Button>
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Backup Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backups.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell className="font-medium">{backup.name}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {backup.type}
                  </span>
                </TableCell>
                <TableCell>{backup.size}</TableCell>
                <TableCell>{backup.timestamp}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
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
