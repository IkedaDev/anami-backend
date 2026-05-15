import { z } from "@hono/zod-openapi";

export interface FindByResponseRepository<T> {
  total: number;
  data: T[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// Función helper para calcular metadatos
export const paginate = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

export type PaginationRequestDto = z.infer<typeof paginationQuerySchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .min(1)
    .default(1)
    .optional()
    .openapi({ example: 1, description: "Page number" }),
  limit: z.coerce
    .number()
    .min(1)
    .max(100)
    .default(10)
    .optional()
    .openapi({ example: 10, description: "Items per page" }),
});
