import { Context } from "hono";
import { HealthService } from "./health.service";
import { ApiResponse } from "../../core/api-response";

export class HealthController {
  constructor(private healthService: HealthService) {}

  check = async (c: Context) => {
    const status = this.healthService.getSystemStatus();
    return ApiResponse.success(c, status, "System is healthy");
  };
}
