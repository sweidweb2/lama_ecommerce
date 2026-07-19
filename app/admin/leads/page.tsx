"use client"

import { useState, useEffect, useCallback } from "react"
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
import { CreateLeadDialog, type AdminLead } from "@/components/admin/lead/create_form"
import { EditLeadDialog } from "@/components/admin/lead/edit_form"
import { DeleteLeadDialog } from "@/components/admin/lead/delete_dialog"
import {
  getLeadsPageAction,
  exportLeadsAction,
  deleteLeadAction,
} from "@/actions/lead"
import { format } from "date-fns"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react"
import { truncateText } from "@/lib/utils"

const LEADS_PER_PAGE = 20
const SEARCH_DEBOUNCE_MS = 300

const MAX_CHARS = {
  email: 40,
  signedUp: 28,
} as const

export default function LeadsPage() {
  const [leads, setLeads] = useState<AdminLead[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query.trim())
      setCurrentPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getLeadsPageAction({
        page: currentPage,
        pageSize: LEADS_PER_PAGE,
        query: debouncedQuery || undefined,
      })
      setLeads(data.items)
      setTotal(data.total)
    } catch (e) {
      console.error("Failed to load leads:", e)
      setError("Failed to load leads. Make sure you are signed in as an admin.")
      setLeads([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, debouncedQuery])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const handleLeadCreated = () => {
    fetchLeads()
  }

  const handleLeadUpdated = () => {
    fetchLeads()
  }

  const handleLeadDeleted = async (leadId: string) => {
    const result = await deleteLeadAction(leadId)
    if (!result.success) {
      toast.error(result.error)
      throw new Error(result.error)
    }
    toast.success("Lead deleted")
    await fetchLeads()
  }

  const totalPages = Math.max(1, Math.ceil(total / LEADS_PER_PAGE))

  const hasActiveFilters = query.trim() !== ""

  const clearFilters = () => {
    setQuery("")
    setDebouncedQuery("")
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const handleExportToCSV = async () => {
    try {
      setIsExporting(true)
      const rows = await exportLeadsAction(debouncedQuery || undefined)
      if (rows.length === 0) {
        toast.error("No leads to export")
        return
      }

      const headers = ["Email", "Status", "Source", "Linked", "Signed Up", "Unsubscribed At"]
      const csvRows = [headers.join(",")]

      rows.forEach((lead) => {
        const email = `"${lead.email.replace(/"/g, '""')}"`
        const status = `"${(lead.status ?? "").replace(/"/g, '""')}"`
        const source = `"${(lead.source ?? "").replace(/"/g, '""')}"`
        const linked = lead.user_id ? "Yes" : "No"
        const signedUp = lead.created_at
          ? `"${format(new Date(lead.created_at), "PPp")}"`
          : '""'
        const unsubscribedAt = lead.unsubscribed_at
          ? `"${format(new Date(lead.unsubscribed_at), "PPp")}"`
          : '""'
        csvRows.push([email, status, source, linked, signedUp, unsubscribedAt].join(","))
      })

      const csvContent = csvRows.join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `leads_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.csv`,
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Leads exported to CSV successfully")
    } catch (e) {
      console.error("Failed to export leads:", e)
      toast.error("Failed to export leads")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Newsletter and lead signups (email collection).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportToCSV}
            disabled={total === 0 || isLoading || isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export to CSV
          </Button>
          <CreateLeadDialog onCreated={handleLeadCreated} />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email…"
          className="max-w-sm"
        />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {total} lead{total === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : (
        <>
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
                  <TableHead className="w-[28%]">Email</TableHead>
                  <TableHead className="w-[14%]">Status</TableHead>
                  <TableHead className="w-[12%]">Source</TableHead>
                  <TableHead className="w-[10%]">Linked</TableHead>
                  <TableHead className="w-[20%]">Signed up</TableHead>
                  <TableHead className="w-[16%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 && !isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {total === 0 && !debouncedQuery
                        ? "No leads yet. Add one or collect signups from the footer."
                        : "No leads match this search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => {
                    const signedUpLabel = lead.created_at
                      ? format(new Date(lead.created_at), "PPp")
                      : "—"
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="w-[28%] font-medium">
                          <div
                            className="max-w-[280px] truncate"
                            title={lead.email}
                          >
                            {truncateText(lead.email, MAX_CHARS.email)}
                          </div>
                        </TableCell>
                        <TableCell className="w-[14%] capitalize text-muted-foreground">
                          {lead.status ?? "—"}
                        </TableCell>
                        <TableCell className="w-[12%] capitalize text-muted-foreground">
                          {lead.source ?? "—"}
                        </TableCell>
                        <TableCell className="w-[10%] text-muted-foreground">
                          {lead.user_id ? "Yes" : "No"}
                        </TableCell>
                        <TableCell className="w-[20%] text-muted-foreground">
                          <span title={signedUpLabel}>
                            {truncateText(signedUpLabel, MAX_CHARS.signedUp)}
                          </span>
                        </TableCell>
                        <TableCell className="w-[16%] text-right">
                          <div className="flex items-center justify-end gap-2">
                            <EditLeadDialog
                              lead={lead}
                              onUpdated={handleLeadUpdated}
                            />
                            <DeleteLeadDialog
                              lead={{ id: lead.id, email: lead.email }}
                              onDelete={handleLeadDeleted}
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
        </>
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
