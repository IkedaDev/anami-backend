import { createMiddleware } from "hono/factory";
import { sendRemoteLog } from "../core/remote-logger";

export const httpLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  const { method, path } = c.req;

  // 1. Ejecutar el resto de la aplicación (esperar respuesta)
  await next();

  // 2. Calcular datos después de la respuesta
  const durationMs = Date.now() - start;
  const status = c.res.status;

  // Capturar IP real (considerando proxies/docker)
  const ip =
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

  // 3. Definir nivel de log según el status HTTP
  let level: "INFO" | "WARN" | "ERROR" = "INFO";
  if (status >= 400) level = "WARN";
  if (status >= 500) level = "ERROR";

  // 4. Enviar a ilogger
  sendRemoteLog({
    level,
    message: `${method} ${path} - ${status}`,
    ip,
    metadata: {
      method,
      path,
      statusCode: status,
      latency: durationMs, // Tiempo exacto que tomó procesar
      userAgent: c.req.header("user-agent"),
      // Si el usuario estaba logueado, podemos intentar sacar su ID del contexto
      // (asumiendo que tu auth middleware guardó el payload)
      userId: c.get("jwtPayload")?.sub || "anonymous",
    },
  });
});
