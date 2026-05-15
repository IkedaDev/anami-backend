import { z } from "@hono/zod-openapi";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "../clients.service";
import { clientResponseSchema } from "../domain/dto/clients.schema";
import { createClientSchema } from "../domain/dto/create-request.dto";
import { updateClientSchema } from "../domain/dto/update-request.dto";
import {
  createPaginatedSuccessSchema,
  createSuccessSchema,
  errorResponseSchema,
} from "@core/api-response";
import { createProtectedRoute } from "@core/openapi-helper";
import { Context } from "hono";
import { CriteriaRequestSchema } from "@core/criteria/schemas/criteria-request.schema";

const service = new ClientsService();
const controller = new ClientsController(service);

const findBy = createProtectedRoute({
  method: "post",
  path: "/clients/paginated",
  tags: ["Clients"],
  summary: "List clients with pagination",
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
      description: "Paginated list of clients",
      content: {
        "application/json": {
          schema: createPaginatedSuccessSchema(clientResponseSchema),
        },
      },
    },
  },
});

const findOne = createProtectedRoute({
  method: "get",
  path: "/clients/{id}",
  tags: ["Clients"],
  summary: "Get client details",
  request: {
    params: z.object({
      id: z.string().openapi({
        example: "0vic6sjo1lhksxadts6462",
        description: "Client unique ID",
      }),
    }),
  },
  responses: {
    200: {
      description: "Client details found",
      content: {
        "application/json": {
          schema: createSuccessSchema(clientResponseSchema),
        },
      },
    },
    404: {
      description: "Client not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

const createRouteDef = createProtectedRoute({
  method: "post",
  path: "/clients",
  tags: ["Clients"],
  summary: "Register new client",
  request: {
    body: {
      content: { "application/json": { schema: createClientSchema } },
    },
  },
  responses: {
    201: {
      description: "Client created successfully",
      content: {
        "application/json": {
          schema: createSuccessSchema(clientResponseSchema),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

const updateRoute = createProtectedRoute({
  method: "patch",
  path: "/clients/{id}",
  tags: ["Clients"],
  summary: "Update client information",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "0vic6sjo1lhksxadts6462" }),
    }),
    body: {
      content: {
        "application/json": { schema: updateClientSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Client updated successfully",
      content: {
        "application/json": {
          schema: createSuccessSchema(clientResponseSchema),
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
  path: "/clients/{id}",
  tags: ["Clients"],
  summary: "Delete client by id",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "0vic6sjo1lhksxadts6462" }),
    }),
  },
  responses: {
    200: {
      description: "Client deleted successfully",
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

// --- EXPORTS ---

export const clientRoutes = {
  findBy: findBy,
  findOne: findOne,
  create: createRouteDef,
  update: updateRoute,
  delete: deleteRoute,
};

export const clientHandlers = {
  findBy: (c: Context) => controller.findBy(c) as any,
  findOne: (c: Context) => controller.findOne(c) as any,
  create: (c: Context) => controller.create(c) as any,
  update: (c: Context) => controller.update(c) as any,
  delete: (c: Context) => controller.delete(c) as any,
};
