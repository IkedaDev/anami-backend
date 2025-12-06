import { z } from "@hono/zod-openapi";

// Schema para CREAR cliente
export const createClientSchema = z.object({
  fullName: z.string().min(2).openapi({ example: "Juan Alfaro" }),
  email: z
    .preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().email().optional()
    )
    .openapi({ example: "juan@example.com" }),
  phone: z.string().optional().openapi({ example: "+56912345678" }),
  address: z.string().optional().openapi({ example: "Av. Siempre Viva 123" }),
  rut: z
    .preprocess((val) => (val === "" ? undefined : val), z.string().optional())
    .openapi({ example: "11.222.333-k" }),
  notes: z
    .string()
    .optional()
    .openapi({ example: "Cliente prefiere masajes suaves" }),
});

// Schema para ACTUALIZAR (Partial)
export const updateClientSchema = createClientSchema.partial();

// Schema de RESPUESTA (Output)
export const clientResponseSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  rut: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(), // Las fechas en JSON viajan como string ISO
});
