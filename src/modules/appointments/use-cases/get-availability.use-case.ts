import { AppointmentRepository } from "../domain/repository/appointment.repository";
import {
  santiagoToUtc,
  getSantiagoStartOfDay,
  getSantiagoEndOfDay,
  getSantiagoTodayDateStr,
} from "@core/utils/date-tz";

export class GetAvailability {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(
    dateStr: string,
    durationMinutes: number,
    excludeId?: string,
  ): Promise<{ date: string; availableSlots: string[] }> {
    const startHour = 8;
    const endHour = 23;

    // 1. Definir el rango de búsqueda en base a hora local de Santiago
    const searchDateStart = getSantiagoStartOfDay(dateStr);
    const searchDateEnd = getSantiagoEndOfDay(dateStr);

    const dayAppointments = await this.repository.findManyByDateRange(
      searchDateStart,
      searchDateEnd,
      excludeId,
    );

    const availableSlots: string[] = [];
    const now = new Date();
    const todayStr = getSantiagoTodayDateStr(now);

    // 2. Generar slots cada 10 minutos
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 10) {
        const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

        const slotStart = santiagoToUtc(dateStr, timeStr);
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

        // VALIDACIÓN A: ¿El slot ya pasó?
        // Solo bloqueamos el pasado si no estamos editando Y la fecha consultada es hoy (o mayor).
        // Si es un día previo, permitimos agendar/editar de forma retroactiva.
        const isPastDay = dateStr < todayStr;
        if (!isPastDay && !excludeId && slotStart.getTime() < now.getTime()) {
          continue;
        }

        // VALIDACIÓN B: ¿La cita termina después del horario de cierre (23:00)?
        const limitHour = santiagoToUtc(dateStr, `${endHour}:00`);
        if (slotEnd.getTime() > limitHour.getTime()) {
          continue;
        }

        // VALIDACIÓN C: ¿Choca con alguna cita existente?
        const isConflict = dayAppointments.some((appt) => {
          const apptStart = appt.startsAt.getTime();
          const apptEnd = appt.endsAt.getTime();
          const sStart = slotStart.getTime();
          const sEnd = slotEnd.getTime();

          // Lógica de traslape: (Inicio1 < Fin2) Y (Fin1 > Inicio2)
          return sStart < apptEnd && sEnd > apptStart;
        });

        if (!isConflict) {
          availableSlots.push(timeStr);
        }
      }
    }

    return { date: dateStr, availableSlots };
  }
}
