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

  async getMetrics(): Promise<any> {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalClients,
      clientsWithRutCount,
      newClientsThisMonth,
      newClientsLastMonth,
      clientsWithEmailCount,
      clientsWithPhoneCount,
    ] = await Promise.all([
      prisma.client.count({ where: { isActive: true } }),
      prisma.client.count({ where: { isActive: true, AND: [{ rut: { not: null } }, { rut: { not: "" } }] } }),
      prisma.client.count({ where: { isActive: true, createdAt: { gte: startOfThisMonth, lte: endOfThisMonth } } }),
      prisma.client.count({ where: { isActive: true, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.client.count({ where: { isActive: true, AND: [{ email: { not: null } }, { email: { not: "" } }] } }),
      prisma.client.count({ where: { isActive: true, AND: [{ phone: { not: null } }, { phone: { not: "" } }] } }),
    ]);

    // Calculate RUT percentage
    const clientsWithRutPercentage = totalClients > 0 ? Math.round((clientsWithRutCount / totalClients) * 1000) / 10 : 0;
    
    // Calculate new clients trend percentage
    let newClientsTrendPercentage = 0;
    let newClientsTrendDirection: "up" | "down" | "neutral" = "neutral";
    
    if (newClientsLastMonth > 0) {
      newClientsTrendPercentage = Math.round(((newClientsThisMonth - newClientsLastMonth) / newClientsLastMonth) * 100);
    } else if (newClientsThisMonth > 0) {
      newClientsTrendPercentage = newClientsThisMonth * 100;
    }

    if (newClientsTrendPercentage > 0) {
      newClientsTrendDirection = "up";
    } else if (newClientsTrendPercentage < 0) {
      newClientsTrendDirection = "down";
    }

    // Contact coverage percentages
    const clientsWithEmailPercentage = totalClients > 0 ? Math.round((clientsWithEmailCount / totalClients) * 1000) / 10 : 0;
    const clientsWithPhonePercentage = totalClients > 0 ? Math.round((clientsWithPhoneCount / totalClients) * 1000) / 10 : 0;

    // Retention Rate: clients with >= 2 completed appointments / total clients with >= 1 completed appointments
    const completedAppointmentsGrouped = await prisma.appointment.groupBy({
      by: ["clientId"],
      where: {
        status: "COMPLETED",
        client: { isActive: true },
      },
      _count: {
        id: true,
      },
    });

    const clientsWithAtLeastOneCompleted = completedAppointmentsGrouped.length;
    const clientsWithAtLeastTwoCompleted = completedAppointmentsGrouped.filter(
      (c) => c._count.id >= 2
    ).length;

    const retentionRate = clientsWithAtLeastOneCompleted > 0 
      ? Math.round((clientsWithAtLeastTwoCompleted / clientsWithAtLeastOneCompleted) * 1000) / 10 
      : 0;

    // Average LTV: total revenue from completed appointments / total active clients
    const revenueAggregation = await prisma.appointment.aggregate({
      where: {
        status: "COMPLETED",
        client: { isActive: true },
      },
      _sum: {
        totalPrice: true,
      },
    });

    const totalRevenue = revenueAggregation._sum.totalPrice ?? 0;
    const averageLtv = totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0;

    // Top 5 clients by completed appointments count
    const topClientsRaw = await prisma.appointment.groupBy({
      by: ["clientId"],
      where: {
        status: "COMPLETED",
        client: { isActive: true },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    const topClientIds = topClientsRaw.map((tc) => tc.clientId);
    const clientsInfo = await prisma.client.findMany({
      where: {
        id: { in: topClientIds },
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    const topClients = topClientsRaw.map((tc) => {
      const info = clientsInfo.find((c) => c.id === tc.clientId);
      return {
        id: tc.clientId,
        name: info?.fullName ?? "Cliente Desconocido",
        appointmentCount: tc._count.id,
      };
    });

    return {
      totalClients,
      clientsWithRutCount,
      clientsWithRutPercentage,
      newClientsThisMonth,
      newClientsLastMonth,
      newClientsTrendPercentage,
      newClientsTrendDirection,
      retentionRate,
      averageLtv,
      clientsWithEmailCount,
      clientsWithEmailPercentage,
      clientsWithPhoneCount,
      clientsWithPhonePercentage,
      topClients,
    };
  }
}
