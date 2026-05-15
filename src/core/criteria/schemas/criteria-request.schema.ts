import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginationQuerySchema } from "@core/pagination";

// Extendemos Zod para poder usar el método .openapi()
extendZodWithOpenApi(z);

// 1. Enums de validación
const FilterOperatorSchema = z
  .enum([
    "EQUAL",
    "NOT_EQUAL",
    "GT",
    "GTE",
    "LT",
    "LTE",
    "CONTAINS",
    "IN",
    "NOT_IN",
  ])
  .openapi({ example: "CONTAINS" });

const OrderTypeSchema = z.enum(["asc", "desc"]).openapi({ example: "asc" });

// 2. Esquema de Condición Simple
const ConditionSchema = z
  .object({
    field: z
      .string()
      .openapi({ description: "Nombre del campo a filtrar", example: "name" }),
    operator: FilterOperatorSchema,
    // Zod any() o union() para aceptar strings, números o booleanos.
    // Usamos z.any() por flexibilidad, pero lo documentamos bien.
    value: z
      .any()
      .openapi({ description: "Valor de búsqueda", example: "Juan" }),
  })
  .openapi("Condition");

// 3. Tipado e Implementación Recursiva (El corazón del Composite Pattern)
// Necesitamos declarar el tipo base en TypeScript para que z.lazy() no se queje
export type FilterNodeRequest =
  | z.infer<typeof ConditionSchema>
  | { logic: "AND" | "OR"; filters: FilterNodeRequest[] };

// Definimos el esquema recursivo
const FilterNodeSchema: z.ZodType<FilterNodeRequest> = z
  .lazy(() =>
    z.union([
      ConditionSchema,
      z.object({
        logic: z.enum(["AND", "OR"]).openapi({ example: "OR" }),
        filters: z.array(FilterNodeSchema),
      }),
    ]),
  )
  .openapi({
    type: "object",

    description:
      "Nodo de filtro que puede ser una condición simple o un grupo lógico (AND/OR)",
  });

// 4. El Request Principal (DTO)
export const CriteriaRequestSchema = z
  .object({
    filters: z
      .array(FilterNodeSchema)
      .optional()
      .default([])
      .openapi({
        description:
          "Lista de filtros a aplicar (soporta anidamiento recursivo con AND/OR)",
        // 👇 Añadimos un ejemplo rico y representativo para que Swagger lo renderice
        example: [
          {
            field: "isActive",
            operator: "EQUAL",
            value: true,
          },
          {
            logic: "OR",
            filters: [
              {
                field: "name",
                operator: "CONTAINS",
                value: "Juan",
              },
              {
                field: "email",
                operator: "CONTAINS",
                value: "@gmail.com",
              },
            ],
          },
        ],
      }),
    orderBy: z.string().optional().openapi({
      description: "Campo por el cual ordenar",
      example: "createdAt",
    }),
    orderType: OrderTypeSchema.optional().default("asc"),

    pagination: paginationQuerySchema.partial().optional(),
  })
  .openapi("CriteriaRequest");

// Exportamos el tipo estático para usarlo en el Controlador
export type CriteriaRequest = z.infer<typeof CriteriaRequestSchema>;
