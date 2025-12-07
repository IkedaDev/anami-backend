import { z } from "@hono/zod-openapi";
import { LocationType, AppointmentStatus } from "@prisma/client";

const LocationTypeSchema = z.nativeEnum(LocationType);
const StatusSchema = z.nativeEnum(AppointmentStatus);

export const createAppointmentSchema = z.object({
  // 1. CORRECCIÓN: Quitamos .uuid() para aceptar IDs antiguos del seed
  clientId: z.string().openapi({ example: "0vic6sjo1lhksxadts6462" }),

  startsAt: z.string().datetime(),

  // 2. CORRECCIÓN: Permitimos array vacío (para Modo Hotel)
  serviceIds: z.array(z.string()).optional().default([]),

  locationType: LocationTypeSchema.default("PARTICULAR"),

  // Agregamos estos campos al input para poder calcular precio Hotel en el backend
  durationMinutes: z.number().optional(), // El frontend lo manda como 'duration' normalmente, revisaremos el controller
  hasNailCut: z.boolean().optional(),

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
  // 1. Permitimos array vacío (para Hotel) y quitamos uuid obligatorio por si acaso
  serviceIds: z.array(z.string()).optional(),
  locationType: LocationTypeSchema.optional(),
  status: StatusSchema.optional(),
  notes: z.string().optional(),

  // 2. Agregamos campos para recálculo de Hotel
  durationMinutes: z.number().optional(),
  hasNailCut: z.boolean().optional(),
});

// Input: Query Params para consultar disponibilidad
export const availabilityQuerySchema = z.object({
  date: z
    .string()
    .date()
    .openapi({ example: "2025-12-05", description: "Format YYYY-MM-DD" }),
  durationMinutes: z.coerce
    .number()
    .min(10)
    .default(40)
    .openapi({ example: 40 }),
  excludeId: z
    .string()
    .optional()
    .openapi({ description: "ID de la cita a ignorar (para edición)" }),
});

// Output: Lista de horarios disponibles
export const availabilityResponseSchema = z.object({
  date: z.string(),
  availableSlots: z
    .array(z.string())
    .openapi({ example: ["08:00", "08:10", "08:20"] }),
});
