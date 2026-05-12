import { FindByResponseRepository } from "@core/pagination";
import { CreateClientDTO } from "../domain/dto/create-request.dto";
import { FindByRequestDTO } from "../domain/dto/find-by-request.dto";
import { UpdateClientDTO } from "../domain/dto/update-request.dto";
import { Client } from "../domain/model/client.model";
import { ClientRepository } from "../domain/repository/client.repository";
import { prisma } from "@core/prisma";

export class ClientMongoRepository implements ClientRepository {
  async findBy(
    req: FindByRequestDTO,
  ): Promise<FindByResponseRepository<Client>> {
    const { page, limit } = req.pagination;
    const skip = (page - 1) * limit;
    const where: any = { isActive: true };

    if (req.id) {
      where.id = req.id;
    }

    if (req.name) {
      where.fullName = { contains: req.name, mode: "insensitive" };
    }

    if (req.email) {
      where.email = { contains: req.email, mode: "insensitive" };
    }

    if (req.rut) {
      where.rut = { contains: req.rut, mode: "insensitive" };
    }

    const [total, rawClients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        orderBy: { fullName: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const data = rawClients.map(
      (c) =>
        new Client({
          id: c.id,
          name: c.fullName,
          email: c.email ?? "",
          phone: c.phone ?? "",
          address: c.address ?? "",
          rut: c.rut ?? "",
          notes: c.notes ?? "",
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }),
    );

    return { data, total };
  }
  async create(req: CreateClientDTO): Promise<Client> {
    const rawClient = await prisma.client.create({
      data: {
        fullName: req.name,
        email: req.email,
        phone: req.phone,
        address: req.address,
        rut: req.rut,
        notes: req.notes,
      },
    });

    return new Client({
      id: rawClient.id,
      name: rawClient.fullName,
      email: rawClient.email ?? "",
      phone: rawClient.phone ?? "",
      address: rawClient.address ?? "",
      rut: rawClient.rut ?? "",
      notes: rawClient.notes ?? "",
      createdAt: rawClient.createdAt,
      updatedAt: rawClient.updatedAt,
    });
  }
  async update(id: string, req: UpdateClientDTO): Promise<Client> {
    const rawClient = await prisma.client.update({
      where: { id },
      data: {
        fullName: req.name,
        email: req.email,
        phone: req.phone,
        address: req.address,
        rut: req.rut,
        notes: req.notes,
      },
    });

    return new Client({
      id: rawClient.id,
      name: rawClient.fullName,
      email: rawClient.email ?? "",
      phone: rawClient.phone ?? "",
      address: rawClient.address ?? "",
      rut: rawClient.rut ?? "",
      notes: rawClient.notes ?? "",
      createdAt: rawClient.createdAt,
      updatedAt: rawClient.updatedAt,
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.client.update({
        where: { id },
        data: { isActive: false },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
