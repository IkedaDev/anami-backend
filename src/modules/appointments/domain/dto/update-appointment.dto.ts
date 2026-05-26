import { z } from "@hono/zod-openapi";
import { LocationType, AppointmentStatus } from "@prisma/client";

const LocationTypeSchema = z.nativeEnum(LocationType);
const StatusSchema = z.nativeEnum(AppointmentStatus);

export type UpdateAppointmentDTO = z.infer<typeof updateAppointmentSchema>;

export const updateAppointmentSchema = z.object({
  startsAt: z.string().datetime().optional(),
  serviceIds: z.array(z.string()).optional(),
  locationType: LocationTypeSchema.optional(),
  status: StatusSchema.optional(),
  notes: z.string().optional(),
  durationMinutes: z.number().optional(),
  hasNailCut: z.boolean().optional(),
});
