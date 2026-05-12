// Schema para CREAR cliente
import { z } from "@hono/zod-openapi";

export type CreateClientDTO = z.infer<typeof createClientSchema>;

export const createClientSchema = z.object({
  name: z.string().min(2).openapi({ example: "Juan Alfaro" }),
  email: z
    .preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().email().optional(),
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
