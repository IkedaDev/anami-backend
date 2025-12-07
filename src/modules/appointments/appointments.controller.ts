import { Context } from "hono";
import { AppointmentsService } from "./appointments.service";
import { ApiResponse } from "../../core/api-response";
import { HTTPException } from "hono/http-exception";

export class AppointmentsController {
  constructor(private service: AppointmentsService) {}

  create = async (c: Context) => {
    try {
      // Validamos el body con Zod (usando 'as never' por el tema de tipos que ya conocemos)
      const body = await c.req.valid("json" as never);

      const newAppointment = await this.service.create(body);

      return ApiResponse.success(
        c,
        newAppointment,
        "Cita agendada exitosamente",
        201
      );
    } catch (error) {
      // Manejo específico de errores HTTP lanzados por el servicio (ej: 409 Conflict)
      if (error instanceof HTTPException) {
        return ApiResponse.error(c, error.message, null, error.status as any);
      }
      // Error genérico
      return ApiResponse.error(c, "Error al agendar la cita", error, 500);
    }
  };

  getAll = async (c: Context) => {
    // Obtenemos los query params validados (gracias a Zod en el paso 5)
    // Usamos 'as any' o el tipo inferido de la ruta si lo tuvieras
    const query = c.req.valid("query" as never);

    const { page, limit, from, to } = query;

    const result = await this.service.findAll(page, limit, from, to);

    // Usamos el nuevo método successPaginated
    return ApiResponse.successPaginated(c, result);
  };

  update = async (c: Context) => {
    const id = c.req.param("id");
    try {
      const body = await c.req.valid("json" as never);
      const updated = await this.service.update(id, body);
      return ApiResponse.success(c, updated, "Cita actualizada exitosamente");
    } catch (error) {
      if (error instanceof HTTPException) {
        return ApiResponse.error(c, error.message, null, error.status as any);
      }
      return ApiResponse.error(c, "Error al actualizar cita", error, 500);
    }
  };

  delete = async (c: Context) => {
    const id = c.req.param("id");
    try {
      await this.service.cancel(id);
      // Devolvemos 200 OK con mensaje de éxito
      return ApiResponse.success(c, null, "Cita cancelada exitosamente");
    } catch (error) {
      if (error instanceof HTTPException) {
        return ApiResponse.error(c, error.message, null, error.status as any);
      }
      return ApiResponse.error(c, "Error al cancelar la cita", error, 500);
    }
  };

  getAvailability = async (c: Context) => {
    const query = await c.req.valid("query" as never);
    // 👇 Extraemos excludeId
    const { date, durationMinutes, excludeId } = query;

    // 👇 Lo pasamos al servicio
    const result = await this.service.getAvailability(
      date,
      durationMinutes,
      excludeId
    );
    return ApiResponse.success(c, result);
  };
}
