import { z } from "@hono/zod-openapi";

export const getDashboardMetricsQuerySchema = z.object({
  referenceDate: z
    .string()
    .datetime()
    .optional()
    .openapi({
      description: "Optional reference date to compute metrics relative to (mostly for testing / seed data). Format: ISO 8601.",
      example: "2025-11-04T15:00:00Z",
    }),
});

export const dashboardMetricsResponseSchema = z.object({
  totalRevenue: z.number().openapi({ example: 450000 }),
  revenueTrend: z.string().openapi({ example: "+15%" }),
  revenueTrendDirection: z.enum(["up", "down", "neutral"]).openapi({ example: "up" }),
  appointmentsToday: z.number().openapi({ example: 6 }),
  appointmentsTodayTrend: z.string().openapi({ example: "Pico a las 15:00" }),
  newClients: z.number().openapi({ example: 12 }),
  newClientsTrend: z.string().openapi({ example: "+4 esta semana" }),
  newClientsTrendDirection: z.enum(["up", "down", "neutral"]).openapi({ example: "up" }),
  weeklyRevenue: z.array(z.number()).openapi({ example: [30000, 40000, 35000, 50000, 49000, 60000, 70000] }),
  revenueSplit: z.object({
    anamiShare: z.number().openapi({ example: 280000 }),
    hotelShare: z.number().openapi({ example: 170000 }),
  }),
});
