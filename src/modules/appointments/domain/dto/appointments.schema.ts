import { z } from "@hono/zod-openapi";
import { AppointmentStatus } from "@prisma/client";

export { createAppointmentSchema } from "./create-appointment.dto";
export { updateAppointmentSchema } from "./update-appointment.dto";

const StatusSchema = z.nativeEnum(AppointmentStatus);

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
