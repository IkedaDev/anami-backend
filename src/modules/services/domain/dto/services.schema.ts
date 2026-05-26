import { z } from "@hono/zod-openapi";

export const serviceResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  basePrice: z.number(),
  durationMin: z.number(),
  isActive: z.boolean(),
  available: z.boolean(),
});

export const servicePerformanceSchema = z.object({
  id: z.string(),
  name: z.string(),
  bookingCount: z.number(),
  revenueGenerated: z.number(),
});

export const serviceMetricsResponseSchema = z.object({
  totalServices: z.number(),
  averagePrice: z.number(),
  activeServicesCount: z.number(),
  noShowRate: z.number(),
  mostBookedServices: z.array(servicePerformanceSchema),
  highestRevenueServices: z.array(servicePerformanceSchema),
  averageDurationMin: z.number(),
  minPrice: z.number(),
  maxPrice: z.number(),
  activePercentage: z.number(),
});

