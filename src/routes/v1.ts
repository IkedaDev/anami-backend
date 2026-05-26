import { OpenAPIHono } from "@hono/zod-openapi";
import { ApiResponse } from "../core/api-response";

// Importamos todos tus módulos
import {
  healthCheckRoute,
  healthHandler,
} from "../modules/health/health.routes";

import {
  serviceRoutes,
  serviceHandlers,
} from "../modules/services/presentation/services.routes";
import {
  appointmentRoutes,
  appointmentHandlers,
} from "../modules/appointments/presentation/appointments.routes";
import { protect } from "../middlewares/auth.middleware";
import {
  authRoutes,
  authHandlers,
} from "../modules/auth/presentation/auth.routes";
import {
  authLimiter,
  generalLimiter,
} from "../middlewares/rate-limit.middleware";
import {
  clientRoutes,
  clientHandlers,
} from "../modules/clients/presentation/clients.routes";

// Creamos una "mini-app" solo para la versión 1
const v1 = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return ApiResponse.error(
        c,
        "Error de Validación (Datos inválidos)",
        result.error,
        400,
      );
    }
  },
});

// --- REGISTRO DE RUTAS V1 ---

v1.use("/*", generalLimiter);

// Health
v1.openapi(healthCheckRoute, healthHandler);

v1.use("/auth/login", authLimiter);
v1.openapi(authRoutes.login, authHandlers.login);

v1.openapi(serviceRoutes.findBy, serviceHandlers.findBy);
v1.openapi(serviceRoutes.findOne, serviceHandlers.findOne);

v1.openapi(appointmentRoutes.list, appointmentHandlers.list);
v1.openapi(appointmentRoutes.availability, appointmentHandlers.availability);

v1.use("/*", protect);

v1.openapi(authRoutes.renew, authHandlers.renew);

// Clients
v1.openapi(clientRoutes.findBy, clientHandlers.findBy);
v1.openapi(clientRoutes.findOne, clientHandlers.findOne);
v1.openapi(clientRoutes.create, clientHandlers.create);
v1.openapi(clientRoutes.update, clientHandlers.update);
v1.openapi(clientRoutes.delete, clientHandlers.delete);

// Services
v1.openapi(serviceRoutes.create, serviceHandlers.create);
v1.openapi(serviceRoutes.update, serviceHandlers.update);
v1.openapi(serviceRoutes.delete, serviceHandlers.delete);

// Appointments
v1.openapi(appointmentRoutes.create, appointmentHandlers.create);
v1.openapi(appointmentRoutes.update, appointmentHandlers.update);
v1.openapi(appointmentRoutes.delete, appointmentHandlers.delete);
v1.openapi(appointmentRoutes.listPaginated, appointmentHandlers.listPaginated);

export default v1;
