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

  async getMetrics(): Promise<any> {
    const [
      totalServices,
      activeServicesCount,
      priceAggregation,
      durationAggregation,
      totalAppointments,
      noShowAppointments,
    ] = await Promise.all([
      prisma.service.count({ where: { isActive: true } }),
      prisma.service.count({ where: { isActive: true, available: true } }),
      prisma.service.aggregate({
        where: { isActive: true },
        _avg: { basePrice: true },
        _min: { basePrice: true },
        _max: { basePrice: true },
      }),
      prisma.service.aggregate({
        where: { isActive: true },
        _avg: { durationMin: true },
      }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "NO_SHOW" } }),
    ]);

    const averagePrice = Math.round(priceAggregation._avg.basePrice ?? 0);
    const minPrice = priceAggregation._min.basePrice ?? 0;
    const maxPrice = priceAggregation._max.basePrice ?? 0;
    const averageDurationMin = Math.round(durationAggregation._avg.durationMin ?? 0);
    const activePercentage = totalServices > 0 ? Math.round((activeServicesCount / totalServices) * 1000) / 10 : 0;
    const noShowRate = totalAppointments > 0 ? Math.round((noShowAppointments / totalAppointments) * 1000) / 10 : 0;

    // Booking & Revenue Statistics grouped by Service
    const bookedServicesRaw = await prisma.appointmentItem.groupBy({
      by: ["serviceId"],
      where: {
        appointment: { status: "COMPLETED" },
      },
      _count: {
        id: true,
      },
      _sum: {
        priceAtTime: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    const revenueServicesRaw = await prisma.appointmentItem.groupBy({
      by: ["serviceId"],
      where: {
        appointment: { status: "COMPLETED" },
      },
      _count: {
        id: true,
      },
      _sum: {
        priceAtTime: true,
      },
      orderBy: {
        _sum: {
          priceAtTime: "desc",
        },
      },
      take: 5,
    });

    const serviceIds = Array.from(
      new Set([
        ...bookedServicesRaw.map((bs) => bs.serviceId),
        ...revenueServicesRaw.map((rs) => rs.serviceId),
      ])
    );

    const servicesInfo = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });

    const mostBookedServices = bookedServicesRaw.map((bs) => {
      const info = servicesInfo.find((s) => s.id === bs.serviceId);
      return {
        id: bs.serviceId,
        name: info?.name ?? "Servicio Desconocido",
        bookingCount: bs._count.id,
        revenueGenerated: bs._sum.priceAtTime ?? 0,
      };
    });

    const highestRevenueServices = revenueServicesRaw.map((rs) => {
      const info = servicesInfo.find((s) => s.id === rs.serviceId);
      return {
        id: rs.serviceId,
        name: info?.name ?? "Servicio Desconocido",
        bookingCount: rs._count.id,
        revenueGenerated: rs._sum.priceAtTime ?? 0,
      };
    });

    return {
      totalServices,
      averagePrice,
      activeServicesCount,
      noShowRate,
      mostBookedServices,
      highestRevenueServices,
      averageDurationMin,
      minPrice,
      maxPrice,
      activePercentage,
    };
  }
}
