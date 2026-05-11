// tests/setup.ts
import { beforeAll, afterEach } from "vitest";
import { prisma } from "../src/core/prisma";

// El "Tracker" de lo que este test creó
export const cleanupQueue: { table: string; id: string }[] = [];

beforeAll(async () => {
  // Solo verificamos que la DB responda, NO borramos nada
  await prisma.$connect();
});

afterEach(async () => {
  if (cleanupQueue.length === 0) return;

  // Limpieza en orden inverso (por si hay dependencias de FK)
  for (const item of [...cleanupQueue].reverse()) {
    try {
      // @ts-ignore: Acceso dinámico a las tablas de Prisma
      await prisma[item.table].delete({ where: { id: item.id } });
    } catch (error) {
      // Si el registro ya fue borrado por el test mismo, ignoramos el error
    }
  }

  // Vaciamos la cola para el siguiente test
  cleanupQueue.length = 0;
});
