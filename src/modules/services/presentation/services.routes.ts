import { createRoute, z } from "@hono/zod-openapi";
import { ServicesService } from "../services.service";
import { serviceResponseSchema } from "../domain/dto/services.schema";
import { ServicesController } from "./services.controller";
import { CriteriaRequestSchema } from "@core/criteria/schemas/criteria-request.schema";
import {
  createPaginatedSuccessSchema,
  createSuccessSchema,
  errorResponseSchema,
} from "@core/api-response";
import { createProtectedRoute } from "@core/openapi-helper";
import { createServiceSchema } from "../domain/dto/create-service.dto";
import { updateServiceSchema } from "../domain/dto/update-service.dto";
import { Context } from "hono";

// Inyección de dependencias
const service = new ServicesService();
const controller = new ServicesController(service);

const findBy = createRoute({
  method: "post",
  path: "/services/paginated",
  tags: ["Services"],
  summary: "List all active services with pagination",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CriteriaRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Paginated list of services",
      content: {
        "application/json": {
          schema: createPaginatedSuccessSchema(serviceResponseSchema),
        },
      },
    },
  },
});

const findOne = createRoute({
  method: "get",
  path: "/services/{id}",
  tags: ["Services"],
  summary: "Get service details",
  request: {
    params: z.object({
      id: z.string().openapi({
        example: "c5bea80a-6185-40ec-8ed2-c03c4f91030f",
        description: "Service unique ID",
      }),
    }),
  },
  responses: {
    200: {
      description: "Service details found",
      content: {
        "application/json": {
          schema: createSuccessSchema(serviceResponseSchema),
        },
      },
    },
    404: {
      description: "Service not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

const create = createProtectedRoute({
  method: "post",
  path: "/services",
  tags: ["Services"],
  summary: "Create a new service",
  request: {
    body: {
      content: { "application/json": { schema: createServiceSchema } },
    },
  },
  responses: {
    201: {
      description: "Service created successfully",
      content: {
        "application/json": {
          schema: createSuccessSchema(serviceResponseSchema),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

const update = createProtectedRoute({
  method: "patch",
  path: "/services/{id}",
  tags: ["Services"],
  summary: "Update a service",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "0vic6sjo1lhksxadts6462" }),
    }),
    body: {
      content: {
        "application/json": { schema: updateServiceSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Service updated successfully",
      content: {
        "application/json": {
          schema: createSuccessSchema(serviceResponseSchema),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

const deleteRoute = createProtectedRoute({
  method: "delete",
  path: "/services/{id}",
  tags: ["Services"],
  summary: "Delete a service",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "0vic6sjo1lhksxadts6462" }),
    }),
  },
  responses: {
    200: {
      description: "Service deleted successfully",
      content: {
        "application/json": {
          schema: createSuccessSchema(z.boolean()),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

export const serviceRoutes = {
  findBy: findBy,
  findOne: findOne,
  create: create,
  update: update,
  delete: deleteRoute,
};

export const serviceHandlers = {
  findBy: (c: Context) => controller.findBy(c) as any,
  findOne: (c: Context) => controller.findOne(c) as any,
  create: (c: Context) => controller.create(c) as any,
  update: (c: Context) => controller.update(c) as any,
  delete: (c: Context) => controller.delete(c) as any,
};
