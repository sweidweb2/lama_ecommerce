import { z } from "zod";

/** Schema for admin creating a shipping zone (name, estimated_time, fee). */
export const createShippingZoneSchema = z.object({
  name: z.string().min(1, "Zone name is required").max(200),
  estimated_time: z.string().max(500).nullable().optional(),
  fee: z.number().min(0, "Fee must be 0 or more").nullable().optional(),
});

export type CreateShippingZoneInput = z.infer<typeof createShippingZoneSchema>;
