import { z } from "@hono/zod-openapi";

// Input: Login
export const loginSchema = z.object({
  email: z.string().email().openapi({ example: "admin@anami.cl" }),
  password: z.string().min(6).openapi({ example: "password123" }),
});

// Output: Token + Datos de usuario
export const authResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    fullName: z.string(),
    role: z.string(),
  }),
});
