"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableWrapper } from "@/components/admin/table-wrapper";
import { Trash2, FileDown } from "lucide-react";
import { deleteBackupAction } from "@/actions/backup";
import type { BackupRow } from "@/repositories/backup.repository";
import { toast } from "sonner";

interface BackupsTableProps {
  backups: BackupRow[];
}

function formatTimestamp(createdAt: string) {
  try {
    return new Date(createdAt).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return createdAt;
  }
}

function DeleteBackupDialog({ backup }: { backup: BackupRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      const result = await deleteBackupAction(backup.id);
      if (!result.success) {
        const message = result.error || "Failed to delete backup.";
        setError(message);
        toast.error("Error", { description: message });
        return;
      }
      toast.success("Backup record deleted", {
        description: `"${backup.name}" has been removed.`,
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete backup.";
      setError(message);
      toast.error("Error", { description: message });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Delete backup record ${backup.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete leftover record</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground mt-2">
            <p>
              Delete metadata row{" "}
              <span className="font-semibold text-foreground">{backup.name}</span>?
            </p>
            <p>This only removes the list entry. It does not delete any SQL file.</p>
          </div>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive mt-4">
              {error}
            </div>
          )}
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              loading={isDeleting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function BackupsTable({ backups }: BackupsTableProps) {
  const [extracting, setExtracting] = useState(false);

  const handleExtractDatabase = async () => {
    setExtracting(true);
    try {
      toast.loading("Extracting database...", { id: "extract-db" });

      const response = await fetch("/api/admin/backups/extract");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to extract database");
      }

      const sql = await response.text();

      const blob = new Blob([sql], { type: "application/sql" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `database-export-${new Date().toISOString().slice(0, 10)}.sql`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Database extracted successfully", {
        id: "extract-db",
        description: `Downloaded ${filename}`,
      });
    } catch (error) {
      console.error("Error extracting database:", error);
      toast.error("Failed to extract database", {
        id: "extract-db",
        description:
          error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Backups</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Download a SQL export of the database
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={handleExtractDatabase}
          loading={extracting}
          loadingText="Extract Database"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Extract Database
        </Button>
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No leftover backup records. Use Extract Database to download a
                  SQL file.
                </TableCell>
              </TableRow>
            ) : (
              backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">{backup.name}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground capitalize">
                      {backup.type}
                    </span>
                  </TableCell>
                  <TableCell>{backup.size ?? "—"}</TableCell>
                  <TableCell>{formatTimestamp(backup.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <DeleteBackupDialog backup={backup} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  );
}
