import { Criteria } from "@core/criteria/criteria";
import { FindByResponseRepository } from "@core/pagination";
import { CreateServiceDTO } from "../domain/dto/create-service.dto";
import { UpdateServiceDTO } from "../domain/dto/update-service.dto";
import { Service } from "../domain/model/service.model";
import { ServiceRepository } from "../domain/repository/service.repository";
import { prisma } from "@core/prisma";
import { PrismaCriteriaConverter } from "@core/criteria/converters/prisma-criteria.converter";

export class ServiceMongoRepository implements ServiceRepository {
  async findBy(criteria: Criteria): Promise<FindByResponseRepository<Service>> {
    const serviceFieldMapping: Record<string, string> = {
      id: "id",
      name: "name",
    };

    const criteriaConverter = new PrismaCriteriaConverter(serviceFieldMapping);

    const queryArgs = criteriaConverter.convert(criteria);

    const where = {
      ...queryArgs.where,
      isActive: true,
    };

    queryArgs.where = where;

    if (!queryArgs.orderBy) {
      queryArgs.orderBy = { name: "asc" };
    }

    const [total, rawServices] = await Promise.all([
      prisma.service.count({ where }),
      prisma.service.findMany(queryArgs),
    ]);

    const data = rawServices.map(
      (s) =>
        new Service({
          id: s.id,
          basePrice: s.basePrice,
          name: s.name,
          description: s.description || "",
          durationMin: s.durationMin,
          isActive: s.isActive,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          available: s.available,
        }),
    );

    return { data, total };
  }

  async create(req: CreateServiceDTO): Promise<Service> {
    const rawService = await prisma.service.create({
      data: {
        basePrice: req.basePrice,
        name: req.name,
        description: req.description,
        durationMin: req.durationMin,
        available: req.available,
        isActive: req.isActive,
      },
    });

    return new Service({
      id: rawService.id,
      basePrice: rawService.basePrice,
      name: rawService.name,
      description: rawService.description || "",
      durationMin: rawService.durationMin,
      isActive: rawService.isActive,
      createdAt: rawService.createdAt,
      updatedAt: rawService.updatedAt,
      available: rawService.available,
    });
  }
  async update(id: string, req: UpdateServiceDTO): Promise<Service> {
    const rawService = await prisma.service.update({
      where: { id },
      data: {
        basePrice: req.basePrice,
        name: req.name,
        description: req.description,
        durationMin: req.durationMin,
        isActive: req.isActive,
        available: req.available,
      },
    });

    return new Service({
      id: rawService.id,
      basePrice: rawService.basePrice,
      name: rawService.name,
      description: rawService.description || "",
      durationMin: rawService.durationMin,
      isActive: rawService.isActive,
      createdAt: rawService.createdAt,
      updatedAt: rawService.updatedAt,
      available: rawService.available,
    });
  }
  async delete(id: string): Promise<boolean> {
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
    return true;
  }
}
