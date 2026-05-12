import { prisma } from "../../src/core/prisma";
import { hash } from "bcryptjs";
import { cleanupQueue } from "../setup";

export const getOrCreateTestUser = async (email = "admin@anami.cl") => {
  // 1. Intentamos buscarlo primero
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { user: existing, rawPassword: "password123" };

  try {
    // 2. Intentamos la creación quirúrgica
    const hashedPassword = await hash("password123", 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: "Admin Test",
        role: "ADMIN",
      },
    });

    // Solo lo agregamos a la cola si lo creamos nosotros exitosamente
    cleanupQueue.push({ table: "user", id: newUser.id });
    return { user: newUser, rawPassword: "password123" };
  } catch (error: any) {
    // 3. Manejo de carrera: Si alguien lo creó justo entre el paso 1 y el 2
    if (error.code === "P2002") {
      const raceWinner = await prisma.user.findUnique({ where: { email } });
      return { user: raceWinner!, rawPassword: "password123" };
    }
    throw error;
  }
};
