import { z } from 'zod';
import { orderBaseSchema } from './base';

// Schema for updating an order from admin tools (e.g. editing contact info).
// Does NOT cover status transitions; those can use a dedicated schema later.

export const updateOrderSchema = orderBaseSchema.partial();

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

