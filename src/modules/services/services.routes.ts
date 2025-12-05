import { createRoute, z } from "@hono/zod-openapi";
import { ServicesController } from "./services.controller";
import { ServicesService } from "./services.service";
import {
  createServiceSchema,
  serviceResponseSchema,
  updateServiceSchema,
} from "./services.schema";

// Inyección de dependencias
const service = new ServicesService();
const controller = new ServicesController(service);

// --- DEFINICIONES OPENAPI ---

const listRoute = createRoute({
  method: "get",
  path: "/services",
  tags: ["Services"],
  summary: "List all active services",
  responses: {
    200: {
      description: "List of services",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.array(serviceResponseSchema),
          }),
        },
      },
    },
  },
});

const createRouteDef = createRoute({
  method: "post",
  path: "/services",
  tags: ["Services"],
  summary: "Create a new service",
  request: {
    body: {
      content: {
        "application/json": { schema: createServiceSchema },
      },
    },
  },
  responses: {
    201: {
      description: "Service created",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: serviceResponseSchema,
          }),
        },
      },
    },
  },
});

const updateRoute = createRoute({
  method: "patch",
  path: "/services/{id}",
  tags: ["Services"],
  summary: "Update a service",
  request: {
    params: z.object({
      id: z
        .string()
        .uuid()
        .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
    }),
    body: {
      content: {
        "application/json": { schema: updateServiceSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Service updated",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: serviceResponseSchema,
          }),
        },
      },
    },
    404: {
      description: "Service not found",
    },
  },
});

// 4. Ruta para ELIMINAR (DELETE)
const deleteRoute = createRoute({
  method: "delete",
  path: "/services/{id}",
  tags: ["Services"],
  summary: "Delete (Soft delete) a service",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "Service deleted",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    404: {
      description: "Service not found",
    },
  },
});

// --- EXPORTS ---

export const serviceRoutes = {
  list: listRoute,
  create: createRouteDef,
  update: updateRoute,
  delete: deleteRoute,
};

export const serviceHandlers = {
  list: controller.getAll,
  create: controller.create,
  update: controller.update,
  delete: controller.delete,
};
