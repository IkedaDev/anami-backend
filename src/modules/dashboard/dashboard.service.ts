import { DashboardMongoRepository } from "./repository/dashboard-mongo.repository";
import { GetDashboardMetrics } from "./use-cases/get-dashboard-metrics.use-case";

export class DashboardService {
  private readonly repository = new DashboardMongoRepository();

  async getMetrics(referenceDate?: Date) {
    return await new GetDashboardMetrics(this.repository).execute(referenceDate);
  }
}
