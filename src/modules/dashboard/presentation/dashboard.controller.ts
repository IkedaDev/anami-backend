import { Context } from "hono";
import { DashboardService } from "../dashboard.service";
import { ApiResponse } from "@core/api-response";

export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  getMetrics = async (c: Context) => {
    try {
      const query = c.req.valid("query" as never) as { referenceDate?: string };
      const referenceDate = query.referenceDate ? new Date(query.referenceDate) : undefined;

      const metrics = await this.service.getMetrics(referenceDate);

      return ApiResponse.success(
        c,
        metrics,
        "Dashboard metrics retrieved successfully"
      );
    } catch (error) {
      return ApiResponse.error(
        c,
        "Error retrieving dashboard metrics",
        error,
        500
      );
    }
  };
}
