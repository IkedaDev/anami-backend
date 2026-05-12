import { UpdateClientDTO } from "../domain/dto/update-request.dto";
import { Client } from "../domain/model/client.model";
import { ClientRepository } from "../domain/repository/client.repository";

abstract class UpdateClientUseCase {
  abstract execute(id: string, req: UpdateClientDTO): Promise<Client>;
}

export class UpdateClient implements UpdateClientUseCase {
  constructor(private readonly repository: ClientRepository) {}

  execute(id: string, req: UpdateClientDTO): Promise<Client> {
    const updatedClient = this.repository.update(id, req);
    return updatedClient;
  }
}
