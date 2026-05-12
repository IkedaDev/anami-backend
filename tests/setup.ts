import { beforeAll, afterEach } from "vitest";
import { prisma } from "../src/core/prisma";

export const cleanupQueue: { table: string; id: string }[] = [];

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  if (cleanupQueue.length === 0) return;

  for (const item of [...cleanupQueue].reverse()) {
    try {
      // @ts-ignore: Acceso dinámico a las tablas de Prisma
      await prisma[item.table].delete({ where: { id: item.id } });
    } catch (error) {}
  }

  cleanupQueue.length = 0;
});
