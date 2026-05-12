import { describe, it, expect } from "vitest";
import { request } from "../helpers/integration";
import { getOrCreateTestUser } from "../factories/user.factory";

describe("Auth Module (Login & Renew)", () => {
  describe("POST /v1/auth/login", () => {
    it("debería iniciar sesión con credenciales válidas", async () => {
      const { user, rawPassword } = await getOrCreateTestUser();

      const { status, body } = await request("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          password: rawPassword,
        }),
      });

      expect(status).toBe(200);
      expect(body.data).toHaveProperty("token");
      expect(body.data.user.email).toBe(user.email);
    });

    it("debería rechazar un login con password incorrecto", async () => {
      const { user } = await getOrCreateTestUser();

      const { status } = await request("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          password: "password_incorrecto",
        }),
      });

      expect(status).toBe(401);
    });
  });

  describe("GET /v1/auth/renew", () => {
    it("debería renovar el token si se envía un JWT válido", async () => {
      const { user, rawPassword } = await getOrCreateTestUser();
      const loginRes = await request("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: user.email, password: rawPassword }),
      });

      const token = loginRes.body.data.token;

      const { status, body } = await request("/v1/auth/renew", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      expect(status).toBe(200);
      expect(body.data).toHaveProperty("token");
      expect(body.data.user.id).toBe(user.id);
    });

    it("debería fallar si no se envía el header de Authorization", async () => {
      const { status } = await request("/v1/auth/renew", {
        method: "GET",
      });

      expect(status).toBe(401);
    });
  });
});
