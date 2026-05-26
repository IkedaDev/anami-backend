import { ClientRepository } from "../domain/repository/client.repository";

abstract class GetClientMetricsUseCase {
  abstract execute(): Promise<any>;
}

export class GetClientMetrics implements GetClientMetricsUseCase {
  constructor(private readonly repository: ClientRepository) {}

  async execute(): Promise<any> {
    return await this.repository.getMetrics();
  }
}
