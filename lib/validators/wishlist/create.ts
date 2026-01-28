import { z } from 'zod';

// Client add/remove wishlist item.

export const createWishlistItemSchema = z.object({
  customised_product_id: z.string().uuid(),
});

export type CreateWishlistItemInput = z.infer<typeof createWishlistItemSchema>;

