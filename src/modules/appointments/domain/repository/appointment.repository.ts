import { Criteria } from "@core/criteria/criteria";
import { FindByResponseRepository } from "@core/pagination";
import { Appointment } from "../model/appointment.model";

export abstract class AppointmentRepository {
  abstract findBy(req: Criteria): Promise<FindByResponseRepository<Appointment>>;
  abstract findUnique(id: string): Promise<Appointment | null>;
  abstract findManyByDateRange(start: Date, end: Date, excludeId?: string): Promise<Appointment[]>;
  abstract hasConflict(start: Date, end: Date, excludeAppointmentId?: string): Promise<boolean>;
  abstract create(data: any): Promise<Appointment>;
  abstract update(id: string, data: any): Promise<Appointment>;
  abstract cancel(id: string): Promise<Appointment>;
}
