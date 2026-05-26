import { describe, it, expect, beforeAll } from "vitest";
import { request } from "../helpers/integration";
import { getOrCreateTestUser } from "../factories/user.factory";
import { getOrService } from "../factories/service.factory";

describe("Services Module", () => {
  let authToken: string;

  beforeAll(async () => {
    const { user, rawPassword } = await getOrCreateTestUser();
    const loginRes = await request("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: user.email, password: rawPassword }),
    });
    authToken = loginRes.body.data.token;
  });

  describe("GET /v1/services/metrics", () => {
    it("debería retornar métricas de servicios con token válido", async () => {
      // Aseguramos que exista al menos un servicio
      await getOrService("Masaje Test");

      const { status, body } = await request("/v1/services/metrics", {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty("totalServices");
      expect(body.data).toHaveProperty("averagePrice");
      expect(body.data).toHaveProperty("activeServicesCount");
      expect(body.data).toHaveProperty("noShowRate");
      expect(body.data).toHaveProperty("mostBookedServices");
      expect(body.data).toHaveProperty("highestRevenueServices");
      expect(body.data).toHaveProperty("averageDurationMin");
      expect(body.data).toHaveProperty("minPrice");
      expect(body.data).toHaveProperty("maxPrice");
      expect(body.data).toHaveProperty("activePercentage");
      expect(Array.isArray(body.data.mostBookedServices)).toBe(true);
      expect(Array.isArray(body.data.highestRevenueServices)).toBe(true);
    });

    it("debería fallar sin token de autorización", async () => {
      const { status } = await request("/v1/services/metrics", {
        method: "GET",
      });
      expect(status).toBe(401);
    });
  });
});
