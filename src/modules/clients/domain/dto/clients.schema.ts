import { z } from "@hono/zod-openapi";

// Schema de RESPUESTA (Output)
export const clientResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  rut: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(), // Las fechas en JSON viajan como string ISO
});

export const topClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  appointmentCount: z.number(),
});

export const clientMetricsResponseSchema = z.object({
  totalClients: z.number(),
  clientsWithRutCount: z.number(),
  clientsWithRutPercentage: z.number(),
  newClientsThisMonth: z.number(),
  newClientsLastMonth: z.number(),
  newClientsTrendPercentage: z.number(),
  newClientsTrendDirection: z.enum(["up", "down", "neutral"]),
  retentionRate: z.number(),
  averageLtv: z.number(),
  clientsWithEmailCount: z.number(),
  clientsWithEmailPercentage: z.number(),
  clientsWithPhoneCount: z.number(),
  clientsWithPhonePercentage: z.number(),
  topClients: z.array(topClientSchema),
});

