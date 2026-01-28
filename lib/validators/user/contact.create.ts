import { z } from 'zod';
import { contactBaseSchema } from './contact.base';

// Schema for creating a contact-us message.

export const createContactSchema = contactBaseSchema;

export type CreateContactInput = z.infer<typeof createContactSchema>;

