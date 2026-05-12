import { paginationQuerySchema } from "@core/pagination";
import { z } from "@hono/zod-openapi";

export type FindByRequestDTO = z.infer<typeof findByRequestSchema>;

export const findByRequestSchema = z.object({
  pagination: paginationQuerySchema,

  // Filtros de búsqueda opcionales
  id: z.string().uuid().optional().openapi({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "ID único del recurso",
  }),

  name: z.string().min(1).optional().openapi({
    example: "Juan Alfaro",
    description: "Filtro por nombre",
  }),

  email: z
    .preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().email().optional(),
    )
    .openapi({
      example: "juan@example.com",
      description: "Filtro por correo electrónico",
    }),

  rut: z
    .preprocess((val) => (val === "" ? undefined : val), z.string().optional())
    .openapi({
      example: "11.222.333-k",
      description: "Filtro por RUT chileno",
    }),
});
