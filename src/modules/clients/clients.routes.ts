import { createRoute, z } from "@hono/zod-openapi";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import {
  createClientSchema,
  clientResponseSchema,
  updateClientSchema,
} from "./clients.schema";

const service = new ClientsService();
const controller = new ClientsController(service);

// --- RUTAS ---

const listRoute = createRoute({
  method: "get",
  path: "/clients",
  tags: ["Clients"],
  summary: "Search or list clients",
  request: {
    query: z.object({
      q: z
        .string()
        .optional()
        .openapi({ description: "Search by name, rut or email" }),
    }),
  },
  responses: {
    200: {
      description: "List of clients",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.array(clientResponseSchema),
          }),
        },
      },
    },
  },
});

const getOneRoute = createRoute({
  method: "get",
  path: "/clients/{id}",
  tags: ["Clients"],
  summary: "Get client details",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "Client details",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: clientResponseSchema,
          }),
        },
      },
    },
    404: { description: "Not found" },
  },
});

const createRouteDef = createRoute({
  method: "post",
  path: "/clients",
  tags: ["Clients"],
  summary: "Register new client",
  request: {
    body: {
      content: {
        "application/json": { schema: createClientSchema },
      },
    },
  },
  responses: {
    201: {
      description: "Client created",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: clientResponseSchema,
          }),
        },
      },
    },
  },
});

const updateRoute = createRoute({
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
      description: "Client updated",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: clientResponseSchema,
          }),
        },
      },
    },
    404: {
      description: "Client not found",
    },
  },
});

// --- EXPORTS ---

export const clientRoutes = {
  list: listRoute,
  getOne: getOneRoute,
  create: createRouteDef,
  update: updateRoute,
};

export const clientHandlers = {
  list: controller.getAll,
  getOne: controller.getOne,
  create: controller.create,
  update: controller.update,
};
