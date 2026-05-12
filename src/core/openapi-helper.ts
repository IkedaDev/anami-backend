// src/core/openapi-helper.ts
import { createRoute as honoCreateRoute, RouteConfig } from "@hono/zod-openapi";

import { errorResponseSchema } from "@core/api-response";

// Respuestas que casi todos los endpoints protegidos comparten
export const globalResponses = {
  401: {
    description: "No autorizado - Token inválido o inexistente",
    content: {
      "application/json": { schema: errorResponseSchema },
    },
  },
  500: {
    description: "Error interno del servidor",
    content: {
      "application/json": { schema: errorResponseSchema },
    },
  },
};

export const createProtectedRoute = <P extends string, R extends RouteConfig>(
  config: R & { path: P },
) => {
  return honoCreateRoute({
    ...config,
    security: [{ BearerAuth: [] }], // Inyectamos seguridad global también
    responses: {
      ...globalResponses,
      ...config.responses, // Las específicas de la ruta pueden sobrescribir las globales
    },
  });
};
