import { z } from "zod";

// Admin CRUD for promo codes.

const promoCodeBaseObjectSchema = z.object({
  code: z.string().min(3).max(50),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().nonnegative(),
  expires_at: z.string().max(100).nullable().optional(),
  max_uses: z.number().int().min(1).nullable().optional(),
  is_active: z.boolean().optional().default(true),
});

/** Cap percentage discounts at 100; fixed amounts stay unbounded nonnegative. */
function refinePromoPercentageDiscount<
  T extends z.ZodType<{
    discount_type?: "percentage" | "fixed";
    discount_value?: number | null;
  }>,
>(schema: T) {
  return schema.superRefine((data, ctx) => {
    if (
      data.discount_type === "percentage" &&
      typeof data.discount_value === "number" &&
      data.discount_value > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage discount cannot exceed 100",
        path: ["discount_value"],
      });
    }
  });
}

export const promoCodeBaseSchema = refinePromoPercentageDiscount(
  promoCodeBaseObjectSchema,
);

/** Object schema without refine — for `.partial()` / `.merge()` composition. */
export { promoCodeBaseObjectSchema, refinePromoPercentageDiscount };

export type PromoCodeBaseInput = z.infer<typeof promoCodeBaseSchema>;
