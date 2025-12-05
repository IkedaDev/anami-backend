import { prisma } from "../../core/prisma";
import { z } from "zod";
import { createClientSchema, updateClientSchema } from "./clients.schema";

type CreateClientDTO = z.infer<typeof createClientSchema>;
type UpdateClientDTO = z.infer<typeof updateClientSchema>;

export class ClientsService {
  // Buscar todos (con filtro opcional por nombre)
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

  async findOne(id: string) {
    return await prisma.client.findUnique({
      where: { id },
    });
  }

  async create(data: CreateClientDTO) {
    return await prisma.client.create({
      data,
    });
  }

  // Nota: Dejamos el método listo aunque no expongas la ruta aún
  async update(id: string, data: UpdateClientDTO) {
    return await prisma.client.update({
      where: { id },
      data,
    });
  }
}
