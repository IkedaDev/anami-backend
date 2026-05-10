import { z } from "zod";
import { loginSchema } from "./domain/dto/auth.schema";

import { UserMongoRepository } from "./repository/user-mongo.repository";
import { LoginUseCase } from "./use-cases/login.use-case";
import { RenewTokenUseCase } from "./use-cases/renew-token.use-case";

export class AuthService {
  private readonly repository = new UserMongoRepository();

  async login(data: z.infer<typeof loginSchema>) {
    return await new LoginUseCase(this.repository).execute(
      data.email,
      data.password,
    );
  }

  async renewToken(userId: string) {
    return await new RenewTokenUseCase(this.repository).execute(userId);
  }
}
