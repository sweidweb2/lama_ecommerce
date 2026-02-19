"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TableWrapper } from "@/components/admin/table-wrapper";
import { CreateLeadDialog, type AdminLead } from "@/components/admin/lead/create_form";
import { EditLeadDialog } from "@/components/admin/lead/edit_form";
import { DeleteLeadDialog } from "@/components/admin/lead/delete_dialog";
import { getLeadsAction, deleteLeadAction } from "@/actions/lead";
import { format } from "date-fns";
import { toast } from "sonner";
import { Download } from "lucide-react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getLeadsAction();
      setLeads(data);
    } catch (e) {
      console.error("Failed to load leads:", e);
      setError("Failed to load leads. Make sure you are signed in as an admin.");
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleLeadCreated = () => {
    fetchLeads();
  };

  const handleLeadUpdated = () => {
    fetchLeads();
  };

  const handleLeadDeleted = async (leadId: string) => {
    const result = await deleteLeadAction(leadId);
    if (!result.success) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    toast.success("Lead deleted");
  };

  const handleExportToCSV = () => {
    if (leads.length === 0) {
      toast.error("No leads to export");
      return;
    }

    // Create CSV headers
    const headers = ["Email", "Signed Up"];
    const csvRows = [headers.join(",")];

    // Add data rows
    leads.forEach((lead) => {
      const email = `"${lead.email.replace(/"/g, '""')}"`; // Escape quotes in email
      const signedUp = lead.created_at
        ? `"${format(new Date(lead.created_at), "PPp")}"`
        : '""';
      csvRows.push([email, signedUp].join(","));
    });

    // Create CSV content
    const csvContent = csvRows.join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Leads exported to CSV successfully");
  };

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
            disabled={leads.length === 0 || isLoading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export to CSV
          </Button>
          <CreateLeadDialog onCreated={handleLeadCreated} />
        </div>
      </div>

      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : (
        <TableWrapper isLoading={isLoading}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Email</TableHead>
                <TableHead className="w-[35%]">Signed up</TableHead>
                <TableHead className="w-[25%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground py-8"
                  >
                    No leads yet. Add one or collect signups from the footer.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium w-[40%]">
                      <div className="truncate" title={lead.email}>{lead.email}</div>
                    </TableCell>
                    <TableCell className="w-[35%] text-muted-foreground">
                      {lead.created_at
                        ? format(new Date(lead.created_at), "PPp")
                        : "—"}
                    </TableCell>
                    <TableCell className="w-[25%] text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EditLeadDialog lead={lead} onUpdated={handleLeadUpdated} />
                        <DeleteLeadDialog
                          lead={{ id: lead.id, email: lead.email }}
                          onDelete={handleLeadDeleted}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      )}
    </div>
  );
}
