import { z } from "@hono/zod-openapi";
import { LocationType, AppointmentStatus } from "@prisma/client";

// Enum para Zod (sincronizado con Prisma)
const LocationTypeSchema = z
  .nativeEnum(LocationType)
  .openapi({ example: "PARTICULAR" });
const StatusSchema = z
  .nativeEnum(AppointmentStatus)
  .openapi({ example: "SCHEDULED" });

// Input para CREAR una cita
export const createAppointmentSchema = z.object({
  clientId: z.string().uuid().openapi({ example: "0vic6sjo1lhksxadts6462" }),

  // Recibimos fecha y hora de inicio (ISO String)
  startsAt: z.string().datetime().openapi({ example: "2025-12-04T15:00:00Z" }),

  // Lista de IDs de servicios que se harán
  serviceIds: z
    .array(z.string().uuid())
    .min(1)
    .openapi({ example: ["41831bfe-bf2b-4a8f-8588-8ffd7741d3bc"] }),

  // Dónde será (Hotel o Particular)
  locationType: LocationTypeSchema.default("PARTICULAR"),

  // Datos opcionales
  notes: z.string().optional(),
});

// Output (Lo que devolvemos)
export const appointmentResponseSchema = z.object({
  id: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  durationMinutes: z.number(),
  status: StatusSchema,

  // Datos financieros (calculados)
  totalPrice: z.number(),
  anamiShare: z.number(),
  hotelShare: z.number(),

  client: z.object({
    fullName: z.string(),
  }),
  items: z.array(
    z.object({
      service: z.object({ name: z.string() }),
      priceAtTime: z.number(),
    })
  ),
});

export const updateAppointmentSchema = z.object({
  startsAt: z.string().datetime().optional(),
  serviceIds: z.array(z.string().uuid()).min(1).optional(),
  locationType: LocationTypeSchema.optional(),
  notes: z.string().optional(),
  status: StatusSchema.optional(), // Permitimos cambiar estado (ej: CANCELLED)
});
