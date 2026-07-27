"use client";

import { useEffect, useRef, useState } from "react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableWrapper } from "@/components/admin/table-wrapper";
import {
  Trash2,
  FileDown,
  ChevronDown,
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
} from "lucide-react";
import { deleteBackupAction } from "@/actions/backup";
import type { BackupRow } from "@/repositories/backup.repository";
import {
  EXTRACT_STEPS,
  type ExtractFormat,
  type ExtractStepId,
  type ExtractStreamEvent,
} from "@/lib/validators/backup/extract";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BackupsTableProps {
  backups: BackupRow[];
}

type StepState = {
  status: "pending" | "active" | "done" | "error";
  message?: string;
  current?: number;
  total?: number;
  table?: string;
};

const FORMAT_OPTIONS: {
  format: ExtractFormat;
  label: string;
  description: string;
}[] = [
  {
    format: "sql",
    label: "SQL",
    description: "Schema + INSERT statements",
  },
  {
    format: "json",
    label: "JSON",
    description: "Structured table data",
  },
  {
    format: "csv",
    label: "CSV",
    description: "Tables as CSV sections",
  },
];

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

function initialStepStates(): Record<ExtractStepId, StepState> {
  return {
    connect: { status: "pending" },
    discover: { status: "pending" },
    export: { status: "pending" },
    package: { status: "pending" },
    done: { status: "pending" },
  };
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

function StepIcon({ status }: { status: StepState["status"] }) {
  if (status === "done") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
  }
  if (status === "active") {
    return <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />;
  }
  if (status === "error") {
    return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  }
  return <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />;
}

function ExtractProgressDialog({
  open,
  format,
  steps,
  error,
  finished,
}: {
  open: boolean;
  format: ExtractFormat | null;
  steps: Record<ExtractStepId, StepState>;
  error: string | null;
  finished: boolean;
}) {
  const activeStep = EXTRACT_STEPS.find(
    (step) => steps[step.id].status === "active",
  );
  const exportStep = steps.export;

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Extracting database</DialogTitle>
          <DialogDescription>
            {format
              ? `Building a ${format.toUpperCase()} backup. This dialog closes automatically when finished.`
              : "Preparing extract…"}
          </DialogDescription>
        </DialogHeader>

        <ol className="mt-2 space-y-3">
          {EXTRACT_STEPS.map((step, index) => {
            const state = steps[step.id];
            const isActive = state.status === "active";
            return (
              <li
                key={step.id}
                className={cn(
                  "flex items-start gap-3 rounded-md border px-3 py-2",
                  isActive && "border-primary/40 bg-primary/5",
                  state.status === "done" && "border-emerald-500/30",
                  state.status === "error" && "border-destructive/40",
                )}
              >
                <div className="mt-0.5">
                  <StepIcon status={state.status} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {index + 1}. {step.label}
                    </p>
                    {typeof state.current === "number" &&
                      typeof state.total === "number" && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {state.current}/{state.total}
                        </span>
                      )}
                  </div>
                  {state.message && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {state.message}
                    </p>
                  )}
                  {step.id === "export" && state.table && (
                    <p className="text-xs text-foreground mt-1 font-mono truncate">
                      Current table: {state.table}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : finished ? (
            "Finished. Closing…"
          ) : activeStep ? (
            <>
              Now: <span className="text-foreground">{activeStep.label}</span>
              {exportStep.table ? (
                <>
                  {" "}
                  —{" "}
                  <span className="font-mono text-foreground">
                    {exportStep.table}
                  </span>
                  {typeof exportStep.current === "number" &&
                    typeof exportStep.total === "number" && (
                      <span className="tabular-nums">
                        {" "}
                        ({exportStep.current}/{exportStep.total})
                      </span>
                    )}
                </>
              ) : null}
            </>
          ) : (
            "Starting…"
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BackupsTable({ backups }: BackupsTableProps) {
  const [extracting, setExtracting] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExtractFormat | null>(
    null,
  );
  const [steps, setSteps] =
    useState<Record<ExtractStepId, StepState>>(initialStepStates);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const resetProgress = () => {
    setSteps(initialStepStates());
    setProgressError(null);
    setFinished(false);
  };

  const scheduleAutoClose = (delayMs = 900) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setProgressOpen(false);
      setExtracting(false);
      setSelectedFormat(null);
      resetProgress();
    }, delayMs);
  };

  const downloadContent = (
    content: string,
    filename: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExtractDatabase = async (format: ExtractFormat) => {
    setExtracting(true);
    setSelectedFormat(format);
    resetProgress();
    setProgressOpen(true);

    try {
      const response = await fetch(
        `/api/admin/backups/extract?format=${format}`,
      );

      if (!response.ok) {
        let message = "Failed to extract database";
        try {
          const error = await response.json();
          message = error.error || message;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }

      if (!response.body) {
        throw new Error("No response stream from extract API");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          const event = JSON.parse(trimmed) as ExtractStreamEvent;

          if (event.type === "progress") {
            setSteps((prev) => ({
              ...prev,
              [event.step]: {
                status: event.status,
                message: event.message,
                current: event.current,
                total: event.total,
                table: event.table,
              },
            }));
            continue;
          }

          if (event.type === "error") {
            setProgressError(event.error);
            setSteps((prev) => {
              const next = { ...prev };
              const activeId = EXTRACT_STEPS.find(
                (step) => next[step.id].status === "active",
              )?.id;
              if (activeId) {
                next[activeId] = {
                  ...next[activeId],
                  status: "error",
                  message: event.error,
                };
              }
              return next;
            });
            throw new Error(event.error);
          }

          if (event.type === "complete") {
            downloadContent(event.content, event.filename, event.mimeType);
            setFinished(true);
            completed = true;
            toast.success("Database extracted successfully", {
              description: `Downloaded ${event.filename}`,
            });
            scheduleAutoClose();
          }
        }
      }

      if (!completed) {
        throw new Error("Extract finished without a downloadable file");
      }
    } catch (error) {
      console.error("Error extracting database:", error);
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setProgressError(message);
      toast.error("Failed to extract database", {
        description: message,
      });
      scheduleAutoClose(1800);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Backups</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Download a SQL, JSON, or CSV export of the database
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="w-full sm:w-auto"
              loading={extracting}
              loadingText="Extract Database"
              disabled={extracting}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Extract Database
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {FORMAT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.format}
                disabled={extracting}
                onSelect={() => {
                  void handleExtractDatabase(option.format);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ExtractProgressDialog
        open={progressOpen}
        format={selectedFormat}
        steps={steps}
        error={progressError}
        finished={finished}
      />

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
                  No leftover backup records. Use Extract Database to download an
                  export file.
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
