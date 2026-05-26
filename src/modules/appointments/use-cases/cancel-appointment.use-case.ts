import { Appointment } from "../domain/model/appointment.model";
import { AppointmentRepository } from "../domain/repository/appointment.repository";
import { HTTPException } from "hono/http-exception";

export class CancelAppointment {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(id: string): Promise<Appointment> {
    const appointment = await this.repository.findUnique(id);

    if (!appointment) {
      throw new HTTPException(404, { message: "Cita no encontrada" });
    }

    return await this.repository.cancel(id);
  }
}
