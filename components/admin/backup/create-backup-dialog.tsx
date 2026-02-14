"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "lucide-react";
import { createBackupAction } from "@/actions/backup";

const BACKUP_TYPES = [
  { value: "full", label: "Full" },
  { value: "incremental", label: "Incremental" },
] as const;

interface CreateBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBackupDialog({ open, onOpenChange }: CreateBackupDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"full" | "incremental">("full");
  const [size, setSize] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await createBackupAction({
        name: name.trim(),
        type,
        size: size.trim() || null,
      });
      if (!result.success) {
        setError(result.error ?? "Failed to create backup");
        return;
      }
      setName("");
      setType("full");
      setSize("");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create backup");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setType("full");
    setSize("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Backup</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="backup-name">
              Backup Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="backup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Full Backup - 2024-01-17"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="backup-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "full" | "incremental")}>
              <SelectTrigger id="backup-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BACKUP_TYPES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="backup-size">Size (optional)</Label>
            <Input
              id="backup-size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="e.g. 2.5 GB"
            />
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Backup"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
