import { createMiddleware } from "hono/factory";
import { sendRemoteLog } from "../core/remote-logger";

export const httpLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  const { method, path } = c.req;

  // --- 1. CAPTURAR BODY PREVENTIVAMENTE ---
  // Clonamos el request para leer el body sin consumirlo para el resto de la app.
  // Esto es vital porque si leemos c.req.json() aquí directamente, el controlador fallará después.
  let capturedBody: any = undefined;

  if (["POST", "PUT", "PATCH"].includes(method)) {
    try {
      // Solo intentamos leer si es JSON
      if (c.req.header("content-type")?.includes("application/json")) {
        const reqClone = c.req.raw.clone();
        capturedBody = await reqClone.json();
      }
    } catch (e) {
      capturedBody = "Error parsing body or invalid JSON";
    }
  }

  // --- 2. EJECUTAR EL RESTO DE LA APP ---
  await next();

  // --- 3. RECOPILAR DATOS POST-EJECUCIÓN ---
  const durationMs = Date.now() - start;
  const status = c.res.status;
  const ip =
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

  if (status < 400) {
    return;
  }
  // Definir nivel de severidad
  let level: "INFO" | "WARN" | "ERROR" = "INFO";
  if (status >= 400) level = "WARN";
  if (status >= 500) level = "ERROR";

  // Recuperar detalles internos del error (inyectados por ApiResponse)
  const failureDetails = c.get("failureDetails") as any;

  // --- 4. PREPARAR CONTEXTO DE LA REQUEST (Solo si hubo error) ---
  // Si todo salió bien (200), no guardamos esto para no llenar la DB de basura.
  let requestContext = undefined;

  if (status >= 400) {
    const queryParams = c.req.query();
    const pathParams = c.req.param();

    requestContext = {
      body: capturedBody, // El JSON que envió el usuario
      query: Object.keys(queryParams).length > 0 ? queryParams : undefined, // ?page=1
      params: Object.keys(pathParams).length > 0 ? pathParams : undefined, // /:id
    };
  }

  // Armar mensaje descriptivo
  let logMessage = `${method} ${path} - ${status}`;
  if (failureDetails) {
    logMessage += ` | ${failureDetails.errorMessage}`;
  }

  // --- 5. ENVIAR LOG ---
  sendRemoteLog({
    level,
    message: logMessage,
    ip,
    metadata: {
      method,
      path,
      statusCode: status,
      latency: durationMs,
      userAgent: c.req.header("user-agent"),
      userId: c.get("jwtPayload")?.sub || "anonymous",

      requestInput: requestContext,

      errorDetails: failureDetails?.errorTrace,
    },
  });
});
