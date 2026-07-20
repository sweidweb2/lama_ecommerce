import { z } from "zod";

/**
 * Schema for creating a backup metadata row.
 */
export const createBackupSchema = z.object({
  name: z.string().trim().min(1, "Backup name is required").max(200),
  type: z.enum(["full", "incremental"]),
  size: z.string().max(100).optional().nullable(),
  storage_path: z.string().max(500).optional().nullable(),
});

export type CreateBackupInput = z.infer<typeof createBackupSchema>;
