import { Context } from "hono";
import { AuthService } from "./auth.service";
import { ApiResponse } from "../../core/api-response";
import { HTTPException } from "hono/http-exception";

export class AuthController {
  constructor(private service: AuthService) {}

  login = async (c: Context) => {
    try {
      const body = await c.req.valid("json" as never);
      const result = await this.service.login(body);
      return ApiResponse.success(c, result, "Login exitoso");
    } catch (error) {
      if (error instanceof HTTPException) {
        return ApiResponse.error(c, error.message, null, error.status as any);
      }
      return ApiResponse.error(c, "Error de autenticación", error, 500);
    }
  };
}
