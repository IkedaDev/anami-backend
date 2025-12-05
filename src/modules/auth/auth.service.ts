import { prisma } from "../../core/prisma";
import { z } from "zod";
import { loginSchema } from "./auth.schema";
import { HTTPException } from "hono/http-exception";
import { compare } from "bcryptjs";
import { sign } from "hono/jwt";

export class AuthService {
  async login(data: z.infer<typeof loginSchema>) {
    // 1. Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: data.email, isActive: true },
    });

    if (!user) {
      throw new HTTPException(401, { message: "Credenciales inválidas" });
    }

    // 2. Verificar contraseña (Bcrypt)
    const isValidPassword = await compare(data.password, user.password);

    if (!isValidPassword) {
      throw new HTTPException(401, { message: "Credenciales inválidas" });
    }

    // 3. Generar Token JWT
    // El payload es la info que viaja dentro del token
    const payload = {
      sub: user.id,
      role: user.role,
      name: user.fullName,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // Expira en 7 días
    };

    const secret = process.env.JWT_SECRET || "secret_dev";
    const token = await sign(payload, secret);

    // 4. Retornar todo
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
