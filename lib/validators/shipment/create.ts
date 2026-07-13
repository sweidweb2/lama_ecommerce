import { z } from 'zod';

// Admin-created shipment record (e.g. when marking as shipped).

export const createShipmentSchema = z.object({
  order_id: z.string().uuid(),
  carrier_name: z.string().min(1, "Carrier name is required").max(100),
  tracking_number: z.string().min(1, "Tracking number is required").max(100),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

