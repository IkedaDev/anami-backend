import { DashboardRepository } from "../domain/repository/dashboard.repository";

abstract class GetDashboardMetricsUseCase {
  abstract execute(referenceDate?: Date): Promise<any>;
}

export class GetDashboardMetrics implements GetDashboardMetricsUseCase {
  constructor(private readonly repository: DashboardRepository) {}

  async execute(referenceDate?: Date): Promise<any> {
    return await this.repository.getMetrics(referenceDate);
  }
}
