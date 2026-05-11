import { prisma } from "../../src/core/prisma";
import { hash } from "bcryptjs";
import { cleanupQueue } from "../setup";

export const getOrCreateTestUser = async (email = "admin@anami.cl") => {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) return { user: existing, rawPassword: "password123" };

  // Si no existe en tu dump de prod, lo creamos quirúrgicamente
  const hashedPassword = await hash("password123", 10);
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName: "Admin Test",
      role: "ADMIN",
    },
  });
  cleanupQueue.push({ table: "user", id: newUser.id });
  return { user: newUser, rawPassword: "password123" };
};
