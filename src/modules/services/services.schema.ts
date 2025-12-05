import { z } from "@hono/zod-openapi";

// 1. Schema para CREAR un servicio (Input)
export const createServiceSchema = z.object({
  name: z.string().min(3).openapi({ example: "Masaje Descontracturante" }),
  description: z
    .string()
    .optional()
    .openapi({ example: "Alivia tensiones musculares profundas" }),
  basePrice: z.number().int().positive().openapi({ example: 25000 }),
  durationMin: z.number().int().positive().default(50).openapi({ example: 50 }),
});

// 2. Schema para ACTUALIZAR (Input - Partial)
// Hace que todos los campos de arriba sean opcionales automáticamente
export const updateServiceSchema = createServiceSchema.partial();

// 3. Schema de RESPUESTA (Output)
// Lo que la API devuelve al frontend
export const serviceResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  basePrice: z.number(),
  durationMin: z.number(),
  isActive: z.boolean(),
  // createdAt y updatedAt suelen omitirse en respuestas simples, pero puedes agregarlos si quieres
});
