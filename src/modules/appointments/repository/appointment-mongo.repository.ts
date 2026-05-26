import { Criteria } from "@core/criteria/criteria";
import { FindByResponseRepository } from "@core/pagination";
import { prisma } from "@core/prisma";
import { PrismaCriteriaConverter } from "@core/criteria/converters/prisma-criteria.converter";
import { Appointment } from "../domain/model/appointment.model";
import { AppointmentRepository } from "../domain/repository/appointment.repository";

function toDomain(raw: any): Appointment {
  return new Appointment({
    id: raw.id,
    clientId: raw.clientId,
    clientName: raw.client?.fullName ?? undefined,
    clientPhone: raw.client?.phone ?? undefined,
    startsAt: raw.startsAt,
    endsAt: raw.endsAt,
    durationMinutes: raw.durationMinutes,
    status: raw.status,
    totalPrice: raw.totalPrice,
    anamiShare: raw.anamiShare,
    hotelShare: raw.hotelShare,
    locationType: raw.locationType,
    hasNailCut: raw.hasNailCut,
    facialType: raw.facialType,
    items: raw.items?.map((item: any) => ({
      id: item.id,
      appointmentId: item.appointmentId,
      serviceId: item.serviceId,
      serviceName: item.service?.name ?? "",
      priceAtTime: item.priceAtTime,
    })),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

export class AppointmentMongoRepository implements AppointmentRepository {
  async findBy(criteria: Criteria): Promise<FindByResponseRepository<Appointment>> {
    const fieldMapping: Record<string, string> = {
      id: "id",
      clientId: "clientId",
      startsAt: "startsAt",
      status: "status",
    };

    const criteriaConverter = new PrismaCriteriaConverter(fieldMapping);
    const queryArgs = criteriaConverter.convert(criteria);

    const [total, rawAppointments] = await Promise.all([
      prisma.appointment.count({ where: queryArgs.where }),
      prisma.appointment.findMany({
        ...queryArgs,
        include: {
          client: { select: { fullName: true, phone: true } },
          items: { include: { service: { select: { name: true } } } },
        },
      }),
    ]);

    const data = rawAppointments.map(toDomain);
    return { data, total };
  }

  async findUnique(id: string): Promise<Appointment | null> {
    const raw = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: { select: { fullName: true, phone: true } },
        items: { include: { service: { select: { name: true } } } },
      },
    });
    if (!raw) return null;
    return toDomain(raw);
  }

  async findManyByDateRange(start: Date, end: Date, excludeId?: string): Promise<Appointment[]> {
    const whereClause: any = {
      status: { not: "CANCELLED" },
      startsAt: {
        gte: start,
        lte: end,
      },
    };

    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const raw = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: { select: { fullName: true, phone: true } },
        items: { include: { service: { select: { name: true } } } },
      },
      orderBy: { startsAt: "desc" },
    });

    return raw.map(toDomain);
  }

  async hasConflict(start: Date, end: Date, excludeAppointmentId?: string): Promise<boolean> {
    const conflict = await prisma.appointment.findFirst({
      where: {
        status: { not: "CANCELLED" },
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        OR: [
          { startsAt: { lte: start }, endsAt: { gt: start } },
          { startsAt: { lt: end }, endsAt: { gte: end } },
          { startsAt: { gte: start }, endsAt: { lte: end } },
        ],
      },
    });
    return conflict !== null;
  }

  async create(data: any): Promise<Appointment> {
    const raw = await prisma.appointment.create({
      data: {
        clientId: data.clientId,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        durationMinutes: data.durationMinutes,
        locationType: data.locationType,
        status: data.status,
        totalPrice: data.totalPrice,
        anamiShare: data.anamiShare,
        hotelShare: data.hotelShare,
        hasNailCut: data.hasNailCut,
        facialType: data.facialType,
        items: data.items,
      },
      include: {
        client: { select: { fullName: true, phone: true } },
        items: { include: { service: { select: { name: true } } } },
      },
    });
    return toDomain(raw);
  }

  async update(id: string, data: any): Promise<Appointment> {
    const raw = await prisma.appointment.update({
      where: { id },
      data: {
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        durationMinutes: data.durationMinutes,
        locationType: data.locationType,
        totalPrice: data.totalPrice,
        anamiShare: data.anamiShare,
        hotelShare: data.hotelShare,
        status: data.status,
        hasNailCut: data.hasNailCut,
        facialType: data.facialType,
        items: data.items,
      },
      include: {
        client: { select: { fullName: true, phone: true } },
        items: { include: { service: { select: { name: true } } } },
      },
    });
    return toDomain(raw);
  }

  async cancel(id: string): Promise<Appointment> {
    const raw = await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: {
        client: { select: { fullName: true, phone: true } },
        items: { include: { service: { select: { name: true } } } },
      },
    });
    return toDomain(raw);
  }
}
