import { FindByResponseRepository } from "@core/pagination";
import { CreateClientDTO } from "../domain/dto/create-request.dto";
import { UpdateClientDTO } from "../domain/dto/update-request.dto";
import { Client } from "../domain/model/client.model";
import { ClientRepository } from "../domain/repository/client.repository";
import { prisma } from "@core/prisma";
import { Criteria } from "@core/criteria/criteria";
import { PrismaCriteriaConverter } from "@core/criteria/converters/prisma-criteria.converter";

export class ClientMongoRepository implements ClientRepository {
  async findBy(criteria: Criteria): Promise<FindByResponseRepository<Client>> {
    const clientFieldMapping: Record<string, string> = {
      name: "fullName",
      email: "email",
      rut: "rut",
      id: "id",
    };

    const criteriaConverter = new PrismaCriteriaConverter(clientFieldMapping);

    const queryArgs = criteriaConverter.convert(criteria);

    const where = {
      ...queryArgs.where,
      isActive: true,
    };

    queryArgs.where = where;

    if (!queryArgs.orderBy) {
      queryArgs.orderBy = { fullName: "asc" };
    }

    const [total, rawClients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany(queryArgs),
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
    await prisma.client.update({
      where: { id },
      data: { isActive: false },
    });
    return true;
  }
}
