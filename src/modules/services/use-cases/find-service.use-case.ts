import { Criteria } from "@core/criteria/criteria";
import { paginate, PaginatedResult } from "@core/pagination";
import { Service } from "../domain/model/service.model";
import { ServiceRepository } from "../domain/repository/service.repository";

abstract class FindServicetUseCase {
  abstract execute(req: Criteria): Promise<PaginatedResult<Service>>;
}

export class FindServices implements FindServicetUseCase {
  constructor(private readonly repository: ServiceRepository) {}

  async execute(req: Criteria): Promise<PaginatedResult<Service>> {
    const { data, total } = await this.repository.findBy(req);
    const paginatedServices = paginate(
      data,
      total,
      req.pagination?.page || 1,
      req.pagination?.limit || 10,
    );
    return paginatedServices;
  }
}
