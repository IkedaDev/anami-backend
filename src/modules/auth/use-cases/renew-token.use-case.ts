import { HTTPException } from "hono/http-exception";
import { LoginResponse } from "../domain/dto/login-response.dto";
import { UserRepository } from "../domain/repository/user.repository";
import { sign } from "hono/jwt";
import { Envs } from "@config/env";

interface IRenewTokenUseCase {
  execute(userId: string): Promise<LoginResponse>;
}

export class RenewTokenUseCase implements IRenewTokenUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(userId: string): Promise<LoginResponse> {
    const user = await this.repository.findBy({ id: userId, isActive: true });

    if (!user) {
      throw new HTTPException(401, {
        message: "Usuario no autorizado o inactivo",
      });
    }

    const payload = {
      id: user.id,
      role: user.role,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    };

    const secret = Envs.JWT_SECRET || "secret_dev";
    const token = await sign(payload, secret);

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
