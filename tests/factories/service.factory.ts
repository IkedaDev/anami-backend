// tests/factories/service.factory.ts
import { prisma } from "../../src/core/prisma";

export const getOrService = async (nameContains: string) => {
  // 1. Intentamos buscar en tu data importada de Prod
  const existing = await prisma.service.findFirst({
    where: { name: { contains: nameContains }, isActive: true },
  });

  if (existing) return existing;

  // 2. Si por alguna razón no existe (ej. base vacía), lo creamos
  return await prisma.service.create({
    data: {
      name: nameContains,
      basePrice: 30000,
      durationMin: 50,
    },
  });
};
