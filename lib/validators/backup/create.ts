import { z } from "zod";

export const createBackupSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["full", "incremental"]),
  size: z.string().max(50).optional().nullable(),
  storage_path: z.string().max(500).optional().nullable(),
});

export type CreateBackupInput = z.infer<typeof createBackupSchema>;
