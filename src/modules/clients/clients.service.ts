import { HTTPException } from "hono/http-exception";
import { prisma } from "../../core/prisma";
import { CreateClientDTO } from "./domain/dto/create-request.dto";
import { FindByRequestDTO } from "./domain/dto/find-by-request.dto";
import { UpdateClientDTO } from "./domain/dto/update-request.dto";
import { ClientMongoRepository } from "./repository/client-mongo.reposiroty";
import { CreateClient } from "./use-cases/create-client.use-case";
import { FindClient } from "./use-cases/find-client.use-case";
import { UpdateClient } from "./use-cases/update-client.use-case";
import { DeleteUser } from "./use-cases/delete-client.use-case";

export class ClientsService {
  private readonly clientRepository = new ClientMongoRepository();

  findBy(body: FindByRequestDTO) {
    const results = new FindClient(this.clientRepository).execute(body);
    return results;
  }

  async findOne(id: string) {
    const results = await new FindClient(this.clientRepository).execute({
      pagination: { page: 1, limit: 1 },
      id,
    });

    if (results.data.length < 1) {
      throw new HTTPException(404, { message: "Client not found" });
    }

    return results.data[0];
  }

  create(data: CreateClientDTO) {
    return new CreateClient(this.clientRepository).execute(data);
  }

  update(id: string, data: UpdateClientDTO) {
    return new UpdateClient(this.clientRepository).execute(id, data);
  }

  async delete(id: string) {
    const isDeleted = await new DeleteUser(this.clientRepository).execute(id);

    if (!isDeleted) {
      throw new HTTPException(404, { message: "Client not found" });
    }

    return isDeleted;
  }
}
