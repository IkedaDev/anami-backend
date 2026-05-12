import { HTTPException } from "hono/http-exception";
import { compare } from "bcryptjs";
import { sign } from "hono/jwt";
import { Envs } from "@config/env";

import { LoginResponse } from "../domain/dto/login-response.dto";
import { UserRepository } from "../domain/repository/user.repository";

interface ILoginUseCase {
  execute(email: string, password: string): Promise<LoginResponse>;
}

export class LoginUseCase implements ILoginUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(email: string, password: string): Promise<LoginResponse> {
    const user = await this.repository.findBy({ email, isActive: true });

    if (!user) {
      throw new HTTPException(401, { message: "Credenciales inválidas" });
    }

    const isValidPassword = await compare(password, user.password);

    if (!isValidPassword) {
      throw new HTTPException(401, { message: "Credenciales inválidas" });
    }

    const payload = {
      id: user.id,
      role: user.role,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // Expira en 7 días
    };

    const secret = Envs.JWT_SECRET || "secret_dev";
    const token = await sign(payload, secret);

    // 4. Retornar todo
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    } as LoginResponse;
  }
}
