import { z } from "@hono/zod-openapi";

export type CreateServiceDTO = z.infer<typeof createServiceSchema>;

export const createServiceSchema = z.object({
  name: z.string().min(3).openapi({ example: "Masaje Descontracturante" }),
  description: z
    .string()
    .optional()
    .openapi({ example: "Alivia tensiones musculares profundas" }),
  basePrice: z.number().int().positive().openapi({ example: 25000 }),
  durationMin: z.number().int().positive().default(50).openapi({ example: 50 }),
  isActive: z.boolean().default(true),
  available: z.boolean().default(true),
});
