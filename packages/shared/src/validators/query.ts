import { z } from "zod";

export const dateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  granularity: z.enum(["hour", "day", "week", "month"]).optional().default("day"),
});

export type DateRangeInput = z.infer<typeof dateRangeSchema>;
