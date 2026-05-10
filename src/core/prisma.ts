import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Envs } from "@config/env";

const connectionString = `${Envs.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });
