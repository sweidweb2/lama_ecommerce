import { z } from "zod";

export const extractFormatSchema = z.enum(["sql", "json", "csv"]);

export type ExtractFormat = z.infer<typeof extractFormatSchema>;

export const EXTRACT_STEPS = [
  { id: "connect", label: "Connect to database" },
  { id: "discover", label: "Discover tables" },
  { id: "export", label: "Export table data" },
  { id: "package", label: "Package download" },
  { id: "done", label: "Complete" },
] as const;

export type ExtractStepId = (typeof EXTRACT_STEPS)[number]["id"];

export type ExtractProgressEvent = {
  type: "progress";
  step: ExtractStepId;
  status: "pending" | "active" | "done" | "error";
  message: string;
  current?: number;
  total?: number;
  table?: string;
};

export type ExtractCompleteEvent = {
  type: "complete";
  filename: string;
  mimeType: string;
  content: string;
};

export type ExtractErrorEvent = {
  type: "error";
  error: string;
};

export type ExtractStreamEvent =
  | ExtractProgressEvent
  | ExtractCompleteEvent
  | ExtractErrorEvent;
