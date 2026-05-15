import { z } from "@hono/zod-openapi";

export const serviceResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  basePrice: z.number(),
  durationMin: z.number(),
  isActive: z.boolean(),
});
