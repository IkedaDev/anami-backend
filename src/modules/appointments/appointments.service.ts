import { CreateAppointmentDTO } from "./domain/dto/create-appointment.dto";
import { UpdateAppointmentDTO } from "./domain/dto/update-appointment.dto";
import { AppointmentMongoRepository } from "./repository/appointment-mongo.repository";
import { CreateAppointment } from "./use-cases/create-appointment.use-case";
import { UpdateAppointment } from "./use-cases/update-appointment.use-case";
import { CancelAppointment } from "./use-cases/cancel-appointment.use-case";
import { FindAppointments } from "./use-cases/find-appointments.use-case";
import { GetAvailability } from "./use-cases/get-availability.use-case";
import { Criteria, FilterOperator } from "@core/criteria/criteria";

export class AppointmentsService {
  private readonly appointmentRepository = new AppointmentMongoRepository();

  create(data: CreateAppointmentDTO) {
    return new CreateAppointment(this.appointmentRepository).execute(data);
  }

  update(id: string, data: UpdateAppointmentDTO) {
    return new UpdateAppointment(this.appointmentRepository).execute(id, data);
  }

  cancel(id: string) {
    return new CancelAppointment(this.appointmentRepository).execute(id);
  }

  getAvailability(dateStr: string, durationMinutes: number, excludeId?: string) {
    return new GetAvailability(this.appointmentRepository).execute(
      dateStr,
      durationMinutes,
      excludeId,
    );
  }

  findAll(page: number, limit: number, from?: string, to?: string) {
    const filters: any[] = [
      { field: "status", operator: FilterOperator.NOT_EQUAL, value: "CANCELLED" },
    ];
    if (from) {
      filters.push({ field: "startsAt", operator: FilterOperator.GTE, value: new Date(from) });
    }
    if (to) {
      filters.push({ field: "startsAt", operator: FilterOperator.LTE, value: new Date(to) });
    }

    return new FindAppointments(this.appointmentRepository).execute(
      new Criteria({
        pagination: { page, limit },
        filters,
        orderBy: "startsAt",
        orderType: "desc" as any,
      })
    );
  }

  async findPaginated(page: number, limit: number, clientId?: string) {
    const filters: any[] = [];
    if (clientId) {
      filters.push({ field: "clientId", operator: FilterOperator.EQUAL, value: clientId });
    }

    const paginated = await new FindAppointments(this.appointmentRepository).execute(
      new Criteria({
        pagination: { page, limit },
        filters,
        orderBy: "startsAt",
        orderType: "desc" as any,
      })
    );

    return {
      data: paginated.data,
      total: paginated.meta.total,
    };
  }
}
