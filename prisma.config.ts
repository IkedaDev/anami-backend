import { defineConfig } from "@prisma/config";
// Asegúrate de importar dotenv para leer el archivo .env
import "dotenv/config";

export default defineConfig({
  datasource: {
    // Aquí es donde ahora se define la conexión
    url: process.env.DATABASE_URL || "",
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
