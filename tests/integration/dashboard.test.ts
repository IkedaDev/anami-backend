import { describe, it, expect, beforeAll } from "vitest";
import { request } from "../helpers/integration";
import { getOrCreateTestUser } from "../factories/user.factory";

describe("Dashboard Module", () => {
  let authToken: string;

  beforeAll(async () => {
    const { user, rawPassword } = await getOrCreateTestUser();
    const loginRes = await request("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: user.email, password: rawPassword }),
    });
    authToken = loginRes.body.data.token;
  });

  describe("GET /v1/dashboard/metrics", () => {
    it("debería retornar métricas del dashboard con token válido", async () => {
      const { status, body } = await request("/v1/dashboard/metrics", {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty("totalRevenue");
      expect(body.data).toHaveProperty("revenueTrend");
      expect(body.data).toHaveProperty("revenueTrendDirection");
      expect(body.data).toHaveProperty("appointmentsToday");
      expect(body.data).toHaveProperty("appointmentsTodayTrend");
      expect(body.data).toHaveProperty("newClients");
      expect(body.data).toHaveProperty("newClientsTrend");
      expect(body.data).toHaveProperty("newClientsTrendDirection");
      expect(body.data).toHaveProperty("weeklyRevenue");
      expect(body.data).toHaveProperty("revenueSplit");
      expect(Array.isArray(body.data.weeklyRevenue)).toBe(true);
      expect(body.data.weeklyRevenue.length).toBe(7);
      expect(body.data.revenueSplit).toHaveProperty("anamiShare");
      expect(body.data.revenueSplit).toHaveProperty("hotelShare");
    });

    it("debería retornar métricas usando query parameter referenceDate", async () => {
      const { status, body } = await request("/v1/dashboard/metrics?referenceDate=2025-11-04T15:00:00Z", {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(body.data.weeklyRevenue.length).toBe(7);
    });

    it("debería fallar sin token de autorización", async () => {
      const { status } = await request("/v1/dashboard/metrics", {
        method: "GET",
      });
      expect(status).toBe(401);
    });
  });
});
