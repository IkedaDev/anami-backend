import { HTTPException } from "hono/http-exception";
import { prisma } from "../../core/prisma";
import { CreateClientDTO } from "./domain/dto/create-request.dto";
import { FindByRequestDTO } from "./domain/dto/find-by-request.dto";
import { UpdateClientDTO } from "./domain/dto/update-request.dto";
import { ClientMongoRepository } from "./repository/client-mongo.reposiroty";
import { CreateClient } from "./use-cases/create-client.use-case";
import { FindClient } from "./use-cases/find-client.use-case";

export class ClientsService {
  // Buscar todos (con filtro opcional por nombre)

  private readonly clientRepository = new ClientMongoRepository();

  async findAll(query?: string) {
    if (!query) {
      // Si no hay búsqueda, devolvemos los últimos 100 para no saturar
      return await prisma.client.findMany({
        take: 100,
        orderBy: { fullName: "asc" },
      });
    }

    // Búsqueda insensible a mayúsculas (Case Insensitive)
    return await prisma.client.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { rut: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { fullName: "asc" },
    });
  }

  async findBy(body: FindByRequestDTO) {
    const results = await new FindClient(this.clientRepository).execute(body);
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

  async create(data: CreateClientDTO) {
    return await new CreateClient(this.clientRepository).execute(data);
  }

  // Nota: Dejamos el método listo aunque no expongas la ruta aún
  async update(id: string, data: UpdateClientDTO) {
    return await prisma.client.update({
      where: { id },
      data,
    });
  }
}
