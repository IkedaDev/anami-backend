import { UpdateAppointmentDTO } from "../domain/dto/update-appointment.dto";
import { Appointment } from "../domain/model/appointment.model";
import { AppointmentRepository } from "../domain/repository/appointment.repository";
import { prisma } from "@core/prisma";
import { HTTPException } from "hono/http-exception";

export class UpdateAppointment {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(id: string, data: UpdateAppointmentDTO): Promise<Appointment> {
    const currentAppt = await this.repository.findUnique(id);

    if (!currentAppt) {
      throw new HTTPException(404, { message: "Cita no encontrada" });
    }

    const locationType = data.locationType || currentAppt.locationType;
    const startsAt = data.startsAt
      ? new Date(data.startsAt)
      : currentAppt.startsAt;

    const duration = data.durationMinutes ?? currentAppt.durationMinutes;
    const hasNailCut = data.hasNailCut ?? currentAppt.hasNailCut;

    let durationMinutes = 0;
    let totalPrice = 0;
    let servicesToConnect: any[] = [];
    let massagePrice = 0;

    if (locationType === "PARTICULAR") {
      const idsToUse =
        data.serviceIds ?? currentAppt.items?.map((i) => i.serviceId) ?? [];

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
        0,
      );
      totalPrice = dbServices.reduce((acc, curr) => acc + curr.basePrice, 0);
      servicesToConnect = dbServices;
    } else {
      const HOTEL_PRICES = {
        massage: { 20: 10000, 40: 20000 },
        nails: { yes: 5000, no: 0 },
      };

      massagePrice = (HOTEL_PRICES.massage as any)[duration] || 0;
      const nailsPrice = hasNailCut ? HOTEL_PRICES.nails.yes : 0;
      totalPrice = massagePrice + nailsPrice;
      durationMinutes = duration + (hasNailCut ? 10 : 0);
      servicesToConnect = [];
    }

    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60000);

    const timeChanged =
      startsAt.getTime() !== currentAppt.startsAt.getTime() ||
      durationMinutes !== currentAppt.durationMinutes;

    if (
      timeChanged &&
      data.status !== "CANCELLED" &&
      currentAppt.status !== "CANCELLED"
    ) {
      const isConflict = await this.repository.hasConflict(startsAt, endsAt, id);
      if (isConflict) {
        throw new HTTPException(409, {
          message: "El horario seleccionado ya está ocupado.",
        });
      }
    }

    let hotelShare = 0;
    let anamiShare = totalPrice;

    if (locationType === "HOTEL") {
      hotelShare = Math.round(massagePrice * 0.4);
      anamiShare = totalPrice - hotelShare;
    }

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

    return await this.repository.update(id, {
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
      notes: data.notes,
      items: itemsOperation,
    });
  }
}
