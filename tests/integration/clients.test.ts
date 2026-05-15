import { describe, it, expect, beforeAll } from "vitest";
import { request } from "../helpers/integration";
import { getOrCreateTestUser } from "../factories/user.factory";
import { createTestClient } from "../factories/client.factory";
import { cleanupQueue } from "../setup";

describe("Clients Module", () => {
  let authToken: string;

  beforeAll(async () => {
    const { user, rawPassword } = await getOrCreateTestUser();
    const loginRes = await request("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: user.email, password: rawPassword }),
    });
    authToken = loginRes.body.data.token;
  });

  describe("POST /v1/clients", () => {
    it("debería crear un nuevo cliente con token válido", async () => {
      const clientData = {
        name: "Nuevo Cliente",
        email: "nuevo@anami.cl",
        rut: "11.222.333-4",
      };

      const { status, body } = await request("/v1/clients", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(clientData),
      });
      cleanupQueue.push({ table: "client", id: body.data.id });
      expect(status).toBe(201);
      expect(body.data.name).toBe(clientData.name);
      expect(body.data).toHaveProperty("id");
    });

    it("debería fallar si falta el token de autorización", async () => {
      const { status } = await request("/v1/clients", { method: "POST" });
      expect(status).toBe(401);
    });
  });

  describe("POST /v1/clients/paginated", () => {
    it("debería retornar una lista paginada de clientes filtrando por nombre", async () => {
      await createTestClient({ fullName: "Buscame" });

      const { status, body } = await request("/v1/clients/paginated", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          filters: [
            {
              field: "name",
              operator: "CONTAINS",
              value: "Buscame",
            },
          ],
          orderBy: "name",
          orderType: "asc",
        }),
      });

      expect(status).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);

      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0].name).toContain("Buscame");

      expect(body.meta).toHaveProperty("total");
    });

    it("debería permitir búsquedas complejas con operadores OR", async () => {
      await createTestClient({ fullName: "Juan Perez", rut: "11111111-1" });
      await createTestClient({ fullName: "Maria Lopez", rut: "22222222-2" });

      const { status, body } = await request("/v1/clients/paginated", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          filters: [
            {
              logic: "OR",
              filters: [
                { field: "name", operator: "CONTAINS", value: "Juan" },
                { field: "rut", operator: "EQUAL", value: "22222222-2" },
              ],
            },
          ],
        }),
      });

      expect(status).toBe(200);
      expect(body.data.length).toBeGreaterThanOrEqual(2);

      const names = body.data.map((c: any) => c.name);
      expect(names).toContain("Juan Perez");
      expect(names).toContain("Maria Lopez");
    });
  });

  describe("GET /v1/clients/:id", () => {
    it("debería obtener los detalles de un cliente existente", async () => {
      const client = await createTestClient();

      const { status, body } = await request(`/v1/clients/${client.id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(status).toBe(200);
      expect(body.data.id).toBe(client.id);
    });

    it("debería retornar 404 para un ID inexistente", async () => {
      const { status } = await request("/v1/clients/non-existent-id", {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(status).toBe(404);
    });
  });

  describe("PATCH /v1/clients/:id", () => {
    it("debería actualizar la información del cliente", async () => {
      const client = await createTestClient();
      const newName = "Nombre Actualizado";

      const { status, body } = await request(`/v1/clients/${client.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ name: newName }),
      });

      expect(status).toBe(200);
      expect(body.data.name).toBe(newName);
    });
  });

  describe("DELETE /v1/clients/:id", () => {
    it("debería marcar al cliente como eliminado (o borrarlo)", async () => {
      const client = await createTestClient();

      const { status, body } = await request(`/v1/clients/${client.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});
