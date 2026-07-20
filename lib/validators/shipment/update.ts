import { z } from "zod";

export const updateShipmentSchema = z.object({
  carrier_name: z.string().min(1, "Carrier name is required").max(100),
  tracking_number: z.string().min(1, "Tracking number is required").max(100),
});

export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
