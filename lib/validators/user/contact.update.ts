import { z } from 'zod';
import { contactBaseSchema } from './contact.base';

// Admin updates to contact messages (e.g. editing metadata).

export const updateContactSchema = contactBaseSchema.partial();

export type UpdateContactInput = z.infer<typeof updateContactSchema>;

