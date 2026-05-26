import { CreateAppointmentDTO } from "../domain/dto/create-appointment.dto";
import { Appointment } from "../domain/model/appointment.model";
import { AppointmentRepository } from "../domain/repository/appointment.repository";
import { prisma } from "@core/prisma";
import { HTTPException } from "hono/http-exception";
import { LocationType, AppointmentStatus } from "@prisma/client";

export class CreateAppointment {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(data: CreateAppointmentDTO): Promise<Appointment> {
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
    let massagePrice = 0;

    if (data.locationType === "PARTICULAR") {
      services = await prisma.service.findMany({
        where: { id: { in: data.serviceIds }, isActive: true },
      });

      if (services.length !== data.serviceIds.length) {
        throw new HTTPException(400, { message: "Servicios inválidos" });
      }

      durationMinutes = services.reduce(
        (acc, curr) => acc + curr.durationMin,
        0,
      );
      totalPrice = services.reduce((acc, curr) => acc + curr.basePrice, 0);
    } else {
      const HOTEL_PRICES = {
        massage: { 20: 10000, 40: 20000 },
        nails: { yes: 5000, no: 0 },
      };

      const duration = data.durationMinutes ?? 20;
      massagePrice = (HOTEL_PRICES.massage as any)[duration] || 0;
      const nailsPrice = data.hasNailCut ? HOTEL_PRICES.nails.yes : 0;
      totalPrice = massagePrice + nailsPrice;
      durationMinutes = duration + (data.hasNailCut ? 10 : 0);
    }

    const startDate = new Date(data.startsAt);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    const isConflict = await this.repository.hasConflict(startDate, endDate);
    if (isConflict) {
      throw new HTTPException(409, {
        message: "El horario seleccionado ya está ocupado.",
      });
    }

    let hotelShare = 0;
    let anamiShare = totalPrice;

    if (data.locationType === LocationType.HOTEL) {
      hotelShare = Math.round(massagePrice * 0.4);
      anamiShare = totalPrice - hotelShare;
    }

    return await this.repository.create({
      clientId: data.clientId,
      startsAt: startDate,
      endsAt: endDate,
      durationMinutes,
      locationType: data.locationType,
      status: AppointmentStatus.SCHEDULED,
      totalPrice,
      anamiShare,
      hotelShare,
      hasNailCut: data.hasNailCut || false,
      facialType: null,
      notes: data.notes,
      items: {
        create: services.map((s) => ({
          serviceId: s.id,
          priceAtTime: s.basePrice,
        })),
      },
    });
  }
}
