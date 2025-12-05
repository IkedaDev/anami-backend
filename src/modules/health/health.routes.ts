import { createRoute, z } from "@hono/zod-openapi";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

// Instanciación manual (Dependency Injection simple)
const service = new HealthService();
const controller = new HealthController(service);

// 1. Definición de la documentación (OpenAPI)
export const healthCheckRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["System"],
  summary: "Check system health",
  description: "Returns the status of the server",
  responses: {
    200: {
      description: "System is up",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({
              status: z.string(),
              uptime: z.number(),
              system: z.string(),
            }),
            timestamp: z.string(),
          }),
        },
      },
    },
  },
});

// 2. Handler
export const healthHandler = controller.check;
