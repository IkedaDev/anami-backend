import { createRoute, z } from "@hono/zod-openapi";
import { AuthController } from "./auth.controller";
import { AuthService } from "../auth.service";
import { loginSchema, authResponseSchema } from "../domain/dto/auth.schema";
import { createSuccessSchema, errorResponseSchema } from "@core/api-response";
import { createProtectedRoute } from "@core/openapi-helper";

const service = new AuthService();
const controller = new AuthController(service);

const loginRoute = createRoute({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "User Login",
  description: "Returns a JWT token to access protected routes.",
  request: {
    body: {
      content: {
        "application/json": { schema: loginSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": { schema: createSuccessSchema(authResponseSchema) },
      },
    },
    401: {
      description: "Invalid credentials",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Error interno del servidor",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
});
const renewRoute = createProtectedRoute({
  method: "get",
  path: "/auth/renew",
  tags: ["Auth"],
  summary: "Renew Session Token",
  description: "Generates a fresh JWT token using a valid existing one.",
  responses: {
    200: {
      description: "Renew token successful",
      content: {
        "application/json": { schema: createSuccessSchema(authResponseSchema) },
      },
    },
  },
});
export const authRoutes = { login: loginRoute, renew: renewRoute };
export const authHandlers = {
  login: controller.login,
  renew: controller.renew,
};
