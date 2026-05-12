import { prisma } from "../../src/core/prisma";
import { GuidGenerator } from "../../src/core/adapters/guid-generator";
import { cleanupQueue } from "../setup";

export const createTestClient = async (overrides = {}) => {
  const client = await prisma.client.create({
    data: {
      fullName: "Cliente de Prueba",
      email: `test-${Date.now()}@example.com`,
      phone: "+56912345678",
      rut: `${Math.floor(Math.random() * 20000000)}-${Math.floor(Math.random() * 9)}`,
      ...overrides,
    },
  });

  // Registramos para limpieza automática después del test
  cleanupQueue.push({ table: "client", id: client.id });
  return client;
};
