import { z } from "@hono/zod-openapi";

// Schema de RESPUESTA (Output)
export const clientResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  rut: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(), // Las fechas en JSON viajan como string ISO
});
