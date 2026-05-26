import { describe, it, expect, beforeAll } from "vitest";
import { request } from "../helpers/integration";
import { getOrCreateTestUser } from "../factories/user.factory";
import { createTestClient } from "../factories/client.factory";
import { getOrService } from "../factories/service.factory";
import { cleanupQueue } from "../setup";

describe("Appointments Module", () => {
  let authToken: string;
  let testService: any;

  beforeAll(async () => {
    const { user, rawPassword } = await getOrCreateTestUser();
    const loginRes = await request("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: user.email, password: rawPassword }),
    });
    authToken = loginRes.body.data.token;
    testService = await getOrService("Masaje Relajante");
  });

  describe("GET /v1/appointments/availability", () => {
    it("debería retornar disponibilidad para una fecha futura", async () => {
      const futureDate = "2030-12-01";
      const { status, body } = await request(`/v1/appointments/availability?date=${futureDate}&durationMinutes=40`, {
        method: "GET",
      });

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.date).toBe(futureDate);
      expect(body.data.availableSlots.length).toBeGreaterThan(0);
    });

    it("debería retornar disponibilidad para una fecha pasada (Corrección de Bug)", async () => {
      const pastDate = "2020-01-01";
      const { status, body } = await request(`/v1/appointments/availability?date=${pastDate}&durationMinutes=40`, {
        method: "GET",
      });

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.date).toBe(pastDate);
      expect(body.data.availableSlots.length).toBeGreaterThan(0);
    });
  });

  describe("CRUD /v1/appointments", () => {
    it("debería realizar el flujo completo de CRUD (Crear, Colisión, Listar, Actualizar, Cancelar)", async () => {
      // Creamos el cliente dentro del bloque del test para que esté disponible durante toda la ejecución
      const testClient = await createTestClient();

      // 1. Crear Cita
      const startsAt = "2030-12-01T10:00:00.000Z";
      const appointmentData = {
        clientId: testClient.id,
        startsAt,
        serviceIds: [testService.id],
        locationType: "PARTICULAR",
        durationMinutes: 50,
      };

      const { status: createStatus, body: createBody } = await request("/v1/appointments", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(appointmentData),
      });

      expect(createStatus).toBe(201);
      expect(createBody.success).toBe(true);
      const appointmentId = createBody.data.id;
      cleanupQueue.push({ table: "appointment", id: appointmentId });

      expect(createBody.data.clientId).toBe(testClient.id);
      expect(createBody.data.totalPrice).toBe(testService.basePrice);

      // 2. Intentar duplicar (Colisión)
      const { status: collisionStatus } = await request("/v1/appointments", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(appointmentData),
      });
      expect(collisionStatus).toBe(409);

      // 3. Listar
      const { status: listStatus, body: listBody } = await request("/v1/appointments?page=1&limit=10", {
        method: "GET",
      });
      expect(listStatus).toBe(200);
      expect(listBody.data.length).toBeGreaterThan(0);

      // 4. Actualizar
      const { status: updateStatus, body: updateBody } = await request(`/v1/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ hasNailCut: true }),
      });
      expect(updateStatus).toBe(200);
      expect(updateBody.success).toBe(true);
      expect(updateBody.data.hasNailCut).toBe(true);

      // 5. Cancelar
      const { status: deleteStatus, body: deleteBody } = await request(`/v1/appointments/${appointmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(deleteStatus).toBe(200);
      expect(deleteBody.success).toBe(true);
    });
  });
});
