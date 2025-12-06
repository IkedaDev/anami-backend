import "dotenv/config";

interface LogPayload {
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  metadata?: Record<string, any>;
  ip?: string;
}

export const sendRemoteLog = (payload: LogPayload) => {
  const url = process.env.LOGGER_SERVICE_URL;
  const apiKey = process.env.LOGGER_API_KEY;

  // Mapeamos NODE_ENV a los valores que espera tu ilogger
  // (DEVELOPMENT, STAGING, PRODUCTION)
  const rawEnv = process.env.NODE_ENV || "development";
  const environment = rawEnv.toUpperCase();

  if (!url || !apiKey) {
    console.warn("⚠️ Logger no configurado (Falta URL o API KEY)");
    return;
  }

  // No usamos 'await' para no bloquear la respuesta al usuario (Non-blocking)
  console.log(url);
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      projectId: "anami-backend", // Identificador fijo de este proyecto
      environment: environment, // "PRODUCTION", etc.
      level: payload.level,
      message: payload.message,
      metadata: payload.metadata,
      ip: payload.ip,
    }),
  }).catch((err) => {
    // Si el logger falla, no queremos romper nuestra app, solo lo mostramos en consola
    console.error("❌ Error enviando log remoto:", err.message);
  });
};
