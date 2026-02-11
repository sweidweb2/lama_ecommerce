import { z } from "zod";

/** Schema for admin updating a shipping zone. */
export const updateShippingZoneSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Zone name is required").max(200),
  estimated_time: z.string().max(500).nullable().optional(),
  fee: z.number().min(0, "Fee must be 0 or more").nullable().optional(),
});

export type UpdateShippingZoneInput = z.infer<typeof updateShippingZoneSchema>;
