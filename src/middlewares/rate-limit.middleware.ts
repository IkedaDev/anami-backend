import { rateLimiter } from "hono-rate-limiter";

// Limite General: 100 peticiones por minuto por IP (Para navegación normal)
export const generalLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  limit: 100,
  keyGenerator: (c) => c.req.header("x-forwarded-for") || "ip", // Usa la IP real si estás detrás de Nginx
  message: { success: false, message: "Demasiadas peticiones, calma un poco." },
});

// Limite Estricto (Login): 5 intentos cada 15 minutos (Para evitar hackeos)
export const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 5,
  keyGenerator: (c) => c.req.header("x-forwarded-for") || "ip",
  message: {
    success: false,
    message: "Demasiados intentos de login. Bloqueado por 15 min.",
  },
});
