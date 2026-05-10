import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { ApiResponse } from "../core/api-response";
import { Envs } from "@config/env";

export const protect = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return ApiResponse.error(c, "No autorizado. Token faltante.", null, 401);
  }

  const token = authHeader.split(" ")[1];
  const secret = Envs.JWT_SECRET || "secret_dev";

  try {
    const payload = await verify(token, secret);
    c.set("jwtPayload", payload);
    await next();
  } catch (error) {
    return ApiResponse.error(c, "Token inválido o expirado.", null, 401);
  }
});
