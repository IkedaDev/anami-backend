import { paginate, PaginatedResult } from "@core/pagination";
import { Client } from "../domain/model/client.model";
import { ClientRepository } from "../domain/repository/client.repository";
import { Criteria } from "@core/criteria/criteria";

abstract class FindClientUseCase {
  abstract execute(req: Criteria): Promise<PaginatedResult<Client>>;
}

export class FindClient implements FindClientUseCase {
  constructor(private readonly repository: ClientRepository) {}

  async execute(req: Criteria): Promise<PaginatedResult<Client>> {
    const { data, total } = await this.repository.findBy(req);
    const paginatedClients = paginate(
      data,
      total,
      req.pagination?.page || 1,
      req.pagination?.limit || 10,
    );
    return paginatedClients;
  }
}
