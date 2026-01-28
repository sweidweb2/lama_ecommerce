import { z } from 'zod';
import { productBaseSchema } from './base';

// Schema for creating a new product (admin).

export const createProductSchema = productBaseSchema;

export type CreateProductInput = z.infer<typeof createProductSchema>;

