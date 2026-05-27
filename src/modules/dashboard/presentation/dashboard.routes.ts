import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "../dashboard.service";
import {
  getDashboardMetricsQuerySchema,
  dashboardMetricsResponseSchema,
} from "../domain/dto/dashboard-metrics.dto";
import { createSuccessSchema } from "@core/api-response";
import { createProtectedRoute } from "@core/openapi-helper";
import { Context } from "hono";

const service = new DashboardService();
const controller = new DashboardController(service);

const metrics = createProtectedRoute({
  method: "get",
  path: "/dashboard/metrics",
  tags: ["Dashboard"],
  summary: "Get general dashboard metrics for cards and charts",
  request: {
    query: getDashboardMetricsQuerySchema,
  },
  responses: {
    200: {
      description: "Dashboard metrics successfully retrieved",
      content: {
        "application/json": {
          schema: createSuccessSchema(dashboardMetricsResponseSchema),
        },
      },
    },
  },
});

export const dashboardRoutes = {
  metrics,
};

export const dashboardHandlers = {
  metrics: (c: Context) => controller.getMetrics(c) as any,
};
