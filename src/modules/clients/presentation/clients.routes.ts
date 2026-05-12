import { createRoute, z } from "@hono/zod-openapi";
import { ClientsController } from "./clients.controller";
import { paginationQuerySchema } from "@core/pagination";
import { ClientsService } from "../clients.service";
import { clientResponseSchema } from "../domain/dto/clients.schema";
import { createClientSchema } from "../domain/dto/create-request.dto";
import { updateClientSchema } from "../domain/dto/update-request.dto";
import { findByRequestSchema } from "../domain/dto/find-by-request.dto";

const service = new ClientsService();
const controller = new ClientsController(service);

// --- RUTAS ---

const findBy = createRoute({
  method: "post",
  path: "/clients/paginated",
  tags: ["Clients"],
  security: [{ BearerAuth: [] }],
  summary: "List clients with pagination and optional search",
  request: {
    query: paginationQuerySchema,
    body: {
      content: {
        "application/json": {
          schema: findByRequestSchema.omit({ pagination: true }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Paginated list of clients",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.array(clientResponseSchema),
            meta: z.any(), // Estructura de PaginationMeta
            timestamp: z.string(),
          }),
        },
      },
    },
  },
});

const findOne = createRoute({
  method: "get",
  path: "/clients/{id}",
  security: [{ BearerAuth: [] }],
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
  security: [{ BearerAuth: [] }],
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
  security: [{ BearerAuth: [] }],
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
  findBy: findBy,
  findOne: findOne,
  create: createRouteDef,
  update: updateRoute,
};

export const clientHandlers = {
  findBy: controller.findBy,
  findOne: controller.findOne,
  create: controller.create,
  update: controller.update,
};
