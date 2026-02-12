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
import { TableWrapper } from "@/components/admin/table-wrapper";
import { CreateLeadDialog, type AdminLead } from "@/components/admin/lead/create_form";
import { EditLeadDialog } from "@/components/admin/lead/edit_form";
import { DeleteLeadDialog } from "@/components/admin/lead/delete_dialog";
import { getLeadsAction, deleteLeadAction } from "@/actions/lead";
import { format } from "date-fns";
import { toast } from "sonner";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Newsletter and lead signups (email collection).
          </p>
        </div>
        <CreateLeadDialog onCreated={handleLeadCreated} />
      </div>

      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : (
        <TableWrapper isLoading={isLoading}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Signed up</TableHead>
                <TableHead className="text-right w-[120px]">Actions</TableHead>
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
                    <TableCell className="font-medium">{lead.email}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {lead.created_at
                        ? format(new Date(lead.created_at), "PPp")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
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
