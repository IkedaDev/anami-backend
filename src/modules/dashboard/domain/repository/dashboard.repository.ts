import { z } from "@hono/zod-openapi";
import { dashboardMetricsResponseSchema } from "../dto/dashboard-metrics.dto";

type DashboardMetricsResponse = z.infer<typeof dashboardMetricsResponseSchema>;

export abstract class DashboardRepository {
  abstract getMetrics(referenceDate?: Date): Promise<DashboardMetricsResponse>;
}
