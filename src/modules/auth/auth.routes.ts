import { createRoute, z } from "@hono/zod-openapi";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { loginSchema, authResponseSchema } from "./auth.schema";

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
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: authResponseSchema,
          }),
        },
      },
    },
    401: { description: "Invalid credentials" },
  },
});

export const authRoutes = { login: loginRoute };
export const authHandlers = { login: controller.login };
