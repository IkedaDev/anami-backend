import { ServiceRepository } from "../domain/repository/service.repository";

abstract class GetServiceMetricsUseCase {
  abstract execute(): Promise<any>;
}

export class GetServiceMetrics implements GetServiceMetricsUseCase {
  constructor(private readonly repository: ServiceRepository) {}

  async execute(): Promise<any> {
    return await this.repository.getMetrics();
  }
}
