import { z } from "@hono/zod-openapi";
import { LocationType } from "@prisma/client";

const LocationTypeSchema = z.nativeEnum(LocationType);

export type CreateAppointmentDTO = z.infer<typeof createAppointmentSchema>;

export const createAppointmentSchema = z.object({
  clientId: z.string().openapi({ example: "0vic6sjo1lhksxadts6462" }),
  startsAt: z.string().datetime(),
  serviceIds: z.array(z.string()).optional().default([]),
  locationType: LocationTypeSchema.default("PARTICULAR"),
  durationMinutes: z.number().optional(),
  hasNailCut: z.boolean().optional(),
  notes: z.string().optional(),
});
