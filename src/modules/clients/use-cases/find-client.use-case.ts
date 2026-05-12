import { paginate, PaginatedResult } from "@core/pagination";
import { Client } from "../domain/model/client.model";
import { FindByRequestDTO } from "../domain/dto/find-by-request.dto";
import { ClientRepository } from "../domain/repository/client.repository";

abstract class FindClientUseCase {
  abstract execute(req: FindByRequestDTO): Promise<PaginatedResult<Client>>;
}

export class FindClient implements FindClientUseCase {
  constructor(private readonly repository: ClientRepository) {}

  async execute(req: FindByRequestDTO): Promise<PaginatedResult<Client>> {
    const { data, total } = await this.repository.findBy(req);
    const paginatedClients = paginate(
      data,
      total,
      req.pagination.page,
      req.pagination.limit,
    );
    return paginatedClients;
  }
}
