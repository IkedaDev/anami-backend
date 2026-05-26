import { Criteria } from "@core/criteria/criteria";
import { paginate, PaginatedResult } from "@core/pagination";
import { Appointment } from "../domain/model/appointment.model";
import { AppointmentRepository } from "../domain/repository/appointment.repository";

export class FindAppointments {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(req: Criteria): Promise<PaginatedResult<Appointment>> {
    const { data, total } = await this.repository.findBy(req);
    return paginate(
      data,
      total,
      req.pagination?.page || 1,
      req.pagination?.limit || 10,
    );
  }
}
