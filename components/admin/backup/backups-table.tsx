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
import { TableWrapper } from "@/components/admin/table-wrapper";
import { Download, Database, Trash2 } from "lucide-react";
import { CreateBackupDialog } from "./create-backup-dialog";
import { deleteBackupAction } from "@/actions/backup";
import type { BackupRow } from "@/repositories/backup.repository";

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

export function BackupsTable({ backups }: BackupsTableProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteBackupAction(id);
      if (result.success) router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Backups</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage database backups and restore points
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          <Database className="mr-2 h-4 w-4" />
          Create Backup
        </Button>
      </div>

      <CreateBackupDialog open={createOpen} onOpenChange={setCreateOpen} />

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
            {backups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No backups yet. Create one to get started.
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
                    <div className="flex items-center justify-end gap-2">
                      {backup.storage_path ? (
                        <Button variant="ghost" size="icon" asChild>
                          <a
                            href={backup.storage_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Download backup"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" disabled aria-label="No download available">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(backup.id)}
                        disabled={deletingId === backup.id}
                        aria-label={`Delete backup ${backup.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
