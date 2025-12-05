import { HTTPException } from "hono/http-exception";
import { LocationType, AppointmentStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../core/prisma";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from "./appointments.schema";
import { paginate } from "../../core/pagination";

type CreateAppointmentDTO = z.infer<typeof createAppointmentSchema>;

export class AppointmentsService {
  // --- REGLA DE NEGOCIO: Buscar Disponibilidad ---
  private async checkAvailability(
    start: Date,
    end: Date,
    excludeAppointmentId?: string
  ) {
    const conflict = await prisma.appointment.findFirst({
      where: {
        status: { not: "CANCELLED" },
        // Si nos pasan un ID, ignoramos esa cita en la búsqueda (porque es la que estamos editando)
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        OR: [
          { startsAt: { lte: start }, endsAt: { gt: start } },
          { startsAt: { lt: end }, endsAt: { gte: end } },
          { startsAt: { gte: start }, endsAt: { lte: end } },
        ],
      },
    });

    if (conflict) {
      throw new HTTPException(409, {
        message: "El horario seleccionado ya está ocupado.",
      });
    }
  }

  // --- REGLA DE NEGOCIO: Crear Cita ---
  async create(data: CreateAppointmentDTO) {
    // 1. Obtener los servicios para saber precios y duración
    const services = await prisma.service.findMany({
      where: { id: { in: data.serviceIds }, isActive: true },
    });

    if (services.length !== data.serviceIds.length) {
      throw new HTTPException(400, {
        message: "Uno o más servicios seleccionados no son válidos.",
      });
    }

    // 2. Calcular Duración Total y Precio Total
    const durationMinutes = services.reduce(
      (acc, curr) => acc + curr.durationMin,
      0
    );
    const totalPrice = services.reduce((acc, curr) => acc + curr.basePrice, 0);

    // 3. Calcular Fechas
    const startDate = new Date(data.startsAt);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000); // Sumar minutos

    // 4. Validar Disponibilidad (Bloqueante)
    await this.checkAvailability(startDate, endDate);

    // 5. Calcular Repartición (Splits)
    // Regla: Si es Hotel, quizás el hotel se lleva un %, o es fijo.
    // Por ahora replicaremos la lógica de tu seed:
    // Si es Hotel, asumimos una regla simple (ej: 60/40) o fija.
    // ADAPTACIÓN: Usaré una lógica base, tú puedes ajustarla:
    let hotelShare = 0;
    let anamiShare = totalPrice;

    if (data.locationType === LocationType.HOTEL) {
      // EJEMPLO DE REGLA: El hotel cobra 40% (ajusta esto según tu negocio real)
      hotelShare = Math.round(totalPrice * 0.4);
      anamiShare = totalPrice - hotelShare;
    }

    // 6. Guardar en Base de Datos (Transacción implícita)
    return await prisma.appointment.create({
      data: {
        clientId: data.clientId,
        startsAt: startDate,
        endsAt: endDate,
        durationMinutes,
        locationType: data.locationType,
        status: AppointmentStatus.SCHEDULED,

        // Datos financieros calculados
        totalPrice,
        anamiShare,
        hotelShare,

        // Relación con los servicios (Item de venta)
        items: {
          create: services.map((s) => ({
            serviceId: s.id,
            priceAtTime: s.basePrice, // Congelamos el precio
          })),
        },
      },
      include: {
        client: { select: { fullName: true } },
        items: { include: { service: true } },
      },
    });
  }

  // Listar calendario (con filtro de fechas)
  async findAll(page: number, limit: number, from?: string, to?: string) {
    const whereClause: any = { status: { not: "CANCELLED" } };

    if (from && to) {
      whereClause.startsAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    // Calculamos el offset (saltos)
    const skip = (page - 1) * limit;

    // Ejecutamos en paralelo: Count + Find
    const [total, appointments] = await prisma.$transaction([
      prisma.appointment.count({ where: whereClause }),
      prisma.appointment.findMany({
        where: whereClause,
        skip, // Saltar
        take: limit, // Tomar
        orderBy: { startsAt: "asc" },
        include: {
          client: { select: { fullName: true } },
          items: { include: { service: { select: { name: true } } } },
        },
      }),
    ]);

    // Usamos el helper para formatear la respuesta estándar
    return paginate(appointments, total, page, limit);
  }

  async update(id: string, data: z.infer<typeof updateAppointmentSchema>) {
    // 1. Obtener la cita actual para tener sus datos base
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: { items: { include: { service: true } } },
    });

    if (!currentAppointment) {
      throw new HTTPException(404, { message: "Cita no encontrada" });
    }

    // --- LÓGICA DE RECALCULO ---

    // A. Servicios y Precios
    let services = currentAppointment.items.map((i) => i.service);
    let totalPrice = currentAppointment.totalPrice;
    let durationMinutes = currentAppointment.durationMinutes;

    // Si vienen nuevos servicios, recalculamos todo desde cero
    if (data.serviceIds) {
      services = await prisma.service.findMany({
        where: { id: { in: data.serviceIds }, isActive: true },
      });

      if (services.length !== data.serviceIds.length) {
        throw new HTTPException(400, { message: "Servicios inválidos" });
      }

      durationMinutes = services.reduce(
        (acc, curr) => acc + curr.durationMin,
        0
      );
      totalPrice = services.reduce((acc, curr) => acc + curr.basePrice, 0);
    }

    // B. Fechas
    // Si viene nueva fecha, la usamos. Si no, usamos la que ya tenía.
    const startDate = data.startsAt
      ? new Date(data.startsAt)
      : currentAppointment.startsAt;

    // Calculamos el fin (Nueva Fecha + Duración (nueva o vieja))
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    // C. Disponibilidad
    // Solo verificamos si cambiaron las fechas o la duración
    const timeChanged =
      data.startsAt ||
      data.serviceIds || // Si cambian servicios, cambia la duración -> cambia el fin -> puede chocar
      startDate.getTime() !== currentAppointment.startsAt.getTime();

    if (timeChanged && data.status !== "CANCELLED") {
      await this.checkAvailability(startDate, endDate, id); // Pasamos el ID para excluirse a sí misma
    }

    // D. Splits (Ganancias)
    // Usamos el nuevo locationType o el viejo si no cambió
    const locationType = data.locationType || currentAppointment.locationType;

    let hotelShare = 0;
    let anamiShare = totalPrice;

    if (locationType === "HOTEL") {
      hotelShare = Math.round(totalPrice * 0.4);
      anamiShare = totalPrice - hotelShare;
    }

    // --- GUARDADO EN DB ---

    // Preparamos la operación de update de items (servicios)
    // Estrategia: Si cambiaron los servicios, borramos los items viejos y creamos nuevos.
    let itemsOperation: any = undefined;
    if (data.serviceIds) {
      itemsOperation = {
        deleteMany: {}, // Borra relaciones viejas
        create: services.map((s) => ({
          serviceId: s.id,
          priceAtTime: s.basePrice,
        })), // Crea relaciones nuevas
      };
    }

    return await prisma.appointment.update({
      where: { id },
      data: {
        startsAt: startDate,
        endsAt: endDate,
        durationMinutes,
        locationType,
        status: data.status, // Actualizamos estado si viene
        totalPrice,
        anamiShare,
        hotelShare,
        items: itemsOperation, // Actualiza la tabla intermedia
      },
      include: {
        client: { select: { fullName: true } },
        items: { include: { service: true } },
      },
    });
  }

  async cancel(id: string) {
    // 1. Verificar que exista
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new HTTPException(404, { message: "Cita no encontrada" });
    }

    // 2. Cambiar estado a CANCELLED (Libera el cupo)
    return await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: {
        client: { select: { fullName: true } },
      },
    });
  }
}
