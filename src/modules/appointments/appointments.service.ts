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

  async create(data: any) {
    // 1. Validaciones previas para Particular
    if (
      data.locationType === "PARTICULAR" &&
      (!data.serviceIds || data.serviceIds.length === 0)
    ) {
      throw new HTTPException(400, {
        message: "Debe seleccionar servicios para citas particulares.",
      });
    }

    let services: any[] = [];
    let durationMinutes = 0;
    let totalPrice = 0;

    // Variables auxiliares para el cálculo del split financiero
    let massagePrice = 0;
    // let nailsPrice = 0; // No la necesitamos explícita para el split, pero sí para el total

    // --- CÁLCULO DE PRECIOS Y DURACIÓN ---

    if (data.locationType === "PARTICULAR") {
      // A. Lógica Particular: Sumar servicios de la DB
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
    } else {
      // B. Lógica Hotel: Cálculo manual (Sin facial)
      const HOTEL_PRICES = {
        massage: { 20: 10000, 40: 20000 },
        nails: { yes: 5000, no: 0 },
      };

      const duration = data.durationMinutes ?? 20;

      massagePrice = (HOTEL_PRICES.massage as any)[duration] || 0;
      const nailsPrice = data.hasNailCut ? HOTEL_PRICES.nails.yes : 0;

      totalPrice = massagePrice + nailsPrice;

      // Duración: Base + 10 min si hay uñas
      durationMinutes = duration + (data.hasNailCut ? 10 : 0);
    }

    // 3. Calcular Fechas
    const startDate = new Date(data.startsAt);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    // 4. Validar Disponibilidad
    await this.checkAvailability(startDate, endDate);

    // 5. Calcular Repartición (Splits)
    let hotelShare = 0;
    let anamiShare = totalPrice;

    if (data.locationType === LocationType.HOTEL) {
      // REGLA: El hotel gana 40% SOLO del masaje. Las uñas son 100% de Anami.
      hotelShare = Math.round(massagePrice * 0.4);
      anamiShare = totalPrice - hotelShare;
    }

    // 6. Guardar en Base de Datos
    return await prisma.appointment.create({
      data: {
        clientId: data.clientId,
        startsAt: startDate,
        endsAt: endDate,
        durationMinutes,
        locationType: data.locationType,
        status: AppointmentStatus.SCHEDULED,

        // Financiero
        totalPrice,
        anamiShare,
        hotelShare,

        // Flags
        hasNailCut: data.hasNailCut || false,
        facialType: null, // Eliminado de la lógica, se guarda como null

        // Relación con servicios (Solo si existen, ej: Particular)
        items: {
          create: services.map((s) => ({
            serviceId: s.id,
            priceAtTime: s.basePrice,
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
    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where: whereClause }),
      prisma.appointment.findMany({
        where: whereClause,
        skip,
        take: limit,
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

  async update(id: string, data: any) {
    const currentAppt = await prisma.appointment.findUnique({
      where: { id },
      include: { items: { include: { service: true } } },
    });

    if (!currentAppt) {
      throw new HTTPException(404, { message: "Cita no encontrada" });
    }

    // Merge de datos nuevos con existentes para no perder info
    const locationType = data.locationType || currentAppt.locationType;
    const startsAt = data.startsAt
      ? new Date(data.startsAt)
      : currentAppt.startsAt;

    // Valores específicos de Hotel
    const duration = data.durationMinutes ?? currentAppt.durationMinutes;
    const hasNailCut = data.hasNailCut ?? currentAppt.hasNailCut;

    let durationMinutes = 0;
    let totalPrice = 0;
    let servicesToConnect: any[] = [];

    let massagePrice = 0;

    // --- RE-CÁLCULO ---

    if (locationType === "PARTICULAR") {
      // Si no enviaron serviceIds, usamos los que ya tenía
      const idsToUse =
        data.serviceIds ?? currentAppt.items.map((i) => i.serviceId);

      if (idsToUse.length === 0) {
        throw new HTTPException(400, {
          message: "Citas particulares requieren servicios.",
        });
      }

      const dbServices = await prisma.service.findMany({
        where: { id: { in: idsToUse }, isActive: true },
      });

      durationMinutes = dbServices.reduce(
        (acc, curr) => acc + curr.durationMin,
        0
      );
      totalPrice = dbServices.reduce((acc, curr) => acc + curr.basePrice, 0);
      servicesToConnect = dbServices;
    } else {
      // Lógica Hotel Manual
      const HOTEL_PRICES = {
        massage: { 20: 10000, 40: 20000 },
        nails: { yes: 5000, no: 0 },
      };

      // Recalcular precios con los valores mergeados
      massagePrice = (HOTEL_PRICES.massage as any)[duration] || 0;
      const nailsPrice = hasNailCut ? HOTEL_PRICES.nails.yes : 0;

      totalPrice = massagePrice + nailsPrice;
      durationMinutes = duration + (hasNailCut ? 10 : 0);

      servicesToConnect = [];
    }

    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60000);

    // Validar Disponibilidad solo si cambiaron tiempos y no se está cancelando
    const timeChanged =
      startsAt.getTime() !== currentAppt.startsAt.getTime() ||
      durationMinutes !== currentAppt.durationMinutes;

    if (
      timeChanged &&
      data.status !== "CANCELLED" &&
      currentAppt.status !== "CANCELLED"
    ) {
      // Se pasa el 'id' para excluir la propia cita del chequeo de conflicto
      await this.checkAvailability(startsAt, endsAt, id);
    }

    // Recalcular Splits (Misma regla de uñas 100%)
    let hotelShare = 0;
    let anamiShare = totalPrice;

    if (locationType === "HOTEL") {
      hotelShare = Math.round(massagePrice * 0.4);
      anamiShare = totalPrice - hotelShare;
    }

    // Preparar operación de items (limpiar y recrear si cambiaron los servicios o el modo)
    let itemsOperation: any = undefined;

    if (data.serviceIds || locationType !== currentAppt.locationType) {
      itemsOperation = {
        deleteMany: {},
        create: servicesToConnect.map((s) => ({
          serviceId: s.id,
          priceAtTime: s.basePrice,
        })),
      };
    }

    return await prisma.appointment.update({
      where: { id },
      data: {
        startsAt,
        endsAt,
        durationMinutes,
        locationType,
        totalPrice,
        anamiShare,
        hotelShare,
        status: data.status,

        hasNailCut,
        facialType: null,

        items: itemsOperation,
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

  async getAvailability(
    dateStr: string,
    durationMinutes: number,
    excludeId?: string
  ) {
    const startHour = 8;
    const endHour = 23;
    const TIMEZONE_OFFSET = 3;

    const searchDateStart = new Date(`${dateStr}T00:00:00.000Z`);
    const searchDateEnd = new Date(searchDateStart);
    searchDateEnd.setDate(searchDateEnd.getDate() + 1);
    searchDateEnd.setUTCHours(23, 59, 59, 999);

    // 👇 CONDICIÓN DE EXCLUSIÓN
    const whereClause: any = {
      status: { not: "CANCELLED" },
      startsAt: {
        gte: searchDateStart,
        lte: searchDateEnd,
      },
    };

    // Si nos pasan un ID para excluir (edición), le decimos a Prisma que NO lo traiga
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const dayAppointments = await prisma.appointment.findMany({
      where: whereClause, // Usamos el objeto dinámico
      select: { startsAt: true, endsAt: true },
    });

    const availableSlots: string[] = [];
    const [year, month, day] = dateStr.split("-").map(Number);
    const now = new Date();
    const bufferTime = 0;

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 10) {
        // Construimos el Slot en UTC (+3 horas)
        const slotStartUTC = new Date(
          Date.UTC(year, month - 1, day, h + TIMEZONE_OFFSET, m, 0)
        );
        const slotEndUTC = new Date(
          slotStartUTC.getTime() + durationMinutes * 60000
        );

        // 1. VALIDACIÓN: ¿Ya pasó?
        if (slotStartUTC.getTime() < now.getTime() + bufferTime) {
          continue;
        }

        // 2. VALIDACIÓN: ¿Cierre local?
        const localEndHour = h + Math.floor((m + durationMinutes) / 60);
        const localEndMin = (m + durationMinutes) % 60;
        if (
          localEndHour > endHour ||
          (localEndHour === endHour && localEndMin > 0)
        ) {
          continue;
        }

        // 3. VALIDACIÓN: ¿Choca? (Ahora dayAppointments trae TODAS las citas posibles)
        const isConflict = dayAppointments.some((appt) => {
          const apptStart = new Date(appt.startsAt).getTime();
          const apptEnd = new Date(appt.endsAt).getTime();
          const sStart = slotStartUTC.getTime();
          const sEnd = slotEndUTC.getTime();

          return sStart < apptEnd && sEnd > apptStart;
        });

        if (!isConflict) {
          availableSlots.push(
            `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
          );
        }
      }
    }

    return { date: dateStr, availableSlots };
  }
}
