import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { PaginationMeta } from "./pagination";
import { z } from "@hono/zod-openapi";

interface IApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

interface IPaginatedApiResponse<T> extends IApiResponse<T> {
  meta: PaginationMeta;
}

export class ApiResponse {
  static success<T, S extends ContentfulStatusCode = 200>(
    c: Context,
    data: T,
    message: string = "Success",
    status: S = 200 as S,
  ) {
    return c.json(
      {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
      } as IApiResponse<T>,
      status,
    );
  }

  static successPaginated<T, S extends ContentfulStatusCode = 200>(
    c: Context,
    paginatedData: { data: T; meta: PaginationMeta },
    message: string = "Success",
    status: S = 200 as S,
  ) {
    return c.json(
      {
        success: true,
        message,
        data: paginatedData.data,
        meta: paginatedData.meta,
        timestamp: new Date().toISOString(),
      } as IPaginatedApiResponse<T>,
      status,
    );
  }

  static error<S extends ContentfulStatusCode = 400>(
    c: Context,
    message: string,
    errors: any = null,
    status: S = 400 as S,
  ) {
    c.set("failureDetails", {
      errorMessage: message,
      errorTrace: errors, // Aquí va el ZodError o el Stack Trace
      status: status,
    });

    return c.json(
      {
        success: false,
        message,
        data: errors,
        timestamp: new Date().toISOString(),
      } as any,
      status,
    );
  }
}

export const createSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().openapi({ example: "Operation successful" }),
    data: dataSchema,
    timestamp: z.string().openapi({ example: new Date().toISOString() }),
  });

export const createPaginatedSuccessSchema = <T extends z.ZodTypeAny>(
  dataSchema: T,
) =>
  z.object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().openapi({ example: "Datos recuperados con éxito" }),
    data: z.array(dataSchema),
    meta: paginationMetaSchema,
    timestamp: z.string(),
  });

export const paginationMetaSchema = z.object({
  total: z.number().openapi({ example: 100 }),
  page: z.number().openapi({ example: 1 }),
  limit: z.number().openapi({ example: 10 }),
  totalPages: z.number().openapi({ example: 10 }),
  hasNextPage: z.boolean().openapi({ example: true }),
  hasPreviousPage: z.boolean().openapi({ example: false }),
});

export const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  message: z.string().openapi({ example: "Descripción del error" }),
  data: z
    .any()
    .nullable()
    .openapi({ description: "Detalles técnicos o de validación" }),
  timestamp: z.string(),
});
