import { CreateClientDTO } from "../domain/dto/create-request.dto";
import { Client } from "../domain/model/client.model";
import { ClientRepository } from "../domain/repository/client.repository";

abstract class CreateClientUseCase {
  abstract execute(client: CreateClientDTO): Promise<Client>;
}

export class CreateClient implements CreateClientUseCase {
  constructor(private readonly repository: ClientRepository) {}

  async execute(clientDto: CreateClientDTO): Promise<Client> {
    const client = await this.repository.create(clientDto);
    return client;
  }
}
