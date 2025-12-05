import { createRoute, z } from "@hono/zod-openapi";
import { paginationQuerySchema } from "../../core/pagination";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";
import {
  createAppointmentSchema,
  appointmentResponseSchema,
  updateAppointmentSchema,
} from "./appointments.schema";

// Inyección de dependencias
const service = new AppointmentsService();
const controller = new AppointmentsController(service);

// --- RUTAS ---

const createRouteDef = createRoute({
  method: "post",
  path: "/appointments",
  tags: ["Appointments"],
  summary: "Schedule a new appointment",
  description:
    "Calculates price, duration and checks availability automatically.",
  request: {
    body: {
      content: {
        "application/json": { schema: createAppointmentSchema },
      },
    },
  },
  responses: {
    201: {
      description: "Appointment scheduled successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: appointmentResponseSchema,
          }),
        },
      },
    },
    409: {
      description: "Time slot conflict (Horario ocupado)",
    },
    400: {
      description: "Invalid services or bad request",
    },
  },
});

const paginatedAppointmentResponse = z.object({
  success: z.boolean(),
  data: z.array(appointmentResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

const listRoute = createRoute({
  method: "get",
  path: "/appointments",
  tags: ["Appointments"],
  summary: "List appointments (Paginated)",
  request: {
    // Mergeamos el schema de paginación con el de fechas
    query: paginationQuerySchema.extend({
      from: z
        .string()
        .datetime()
        .optional()
        .openapi({ example: "2025-12-01T00:00:00Z" }),
      to: z
        .string()
        .datetime()
        .optional()
        .openapi({ example: "2025-12-31T23:59:59Z" }),
    }),
  },
  responses: {
    200: {
      description: "List of appointments",
      content: {
        "application/json": {
          schema: paginatedAppointmentResponse, // Usamos el schema con meta
        },
      },
    },
  },
});

const updateRoute = createRoute({
  method: "patch",
  path: "/appointments/{id}",
  tags: ["Appointments"],
  summary: "Update appointment details",
  description:
    "Recalculates prices and checks availability automatically based on changes.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": { schema: updateAppointmentSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Appointment updated",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: appointmentResponseSchema,
          }),
        },
      },
    },
    404: { description: "Appointment not found" },
    409: { description: "New schedule conflict" },
    400: { description: "Bad request" },
  },
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/appointments/{id}",
  tags: ["Appointments"],
  summary: "Cancel an appointment (Soft Delete)",
  description:
    "Changes status to CANCELLED to free up the time slot, but keeps the record.",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "Appointment cancelled",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    404: { description: "Appointment not found" },
  },
});

// --- EXPORTS ---

export const appointmentRoutes = {
  create: createRouteDef,
  list: listRoute,
  update: updateRoute,
  delete: deleteRoute,
};

export const appointmentHandlers = {
  create: controller.create,
  list: controller.getAll,
  update: controller.update,
  delete: controller.delete,
};
