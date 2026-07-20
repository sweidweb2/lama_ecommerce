import { z } from "zod";

const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const adminDateYmdSchema = z
  .string()
  .regex(ymdRegex, { message: "Date must be YYYY-MM-DD." });

export const adminDateRangeSearchParamsSchema = z.object({
  from: adminDateYmdSchema.optional(),
  to: adminDateYmdSchema.optional(),
  preset: z.enum(["this_month", "last_30d", "all"]).optional(),
});

export type AdminDateRangeSearchParams = z.infer<
  typeof adminDateRangeSearchParamsSchema
>;
