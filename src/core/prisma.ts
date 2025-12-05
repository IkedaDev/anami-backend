import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// En la v7, pasamos la URL en el constructor o confiamos en el config
const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });
