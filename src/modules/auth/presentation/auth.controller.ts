import { Context } from "hono";
import { AuthService } from "../auth.service";
import { APIResponse } from "@core/decorators/api-response";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  @APIResponse("Sesión iniciada correctamente")
  async login(c: Context) {
    const { email, password } = await c.req.json();
    return await this.service.login({ email, password });
  }

  @APIResponse("Token renovado")
  async renew(c: Context) {
    const payload = c.get("jwtPayload");
    return await this.service.renewToken(payload.id);
  }
}
