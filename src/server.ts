import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import "dotenv/config";
import { logger } from "hono/logger";
import { Scalar } from "@scalar/hono-api-reference";
import v1 from "./routes/v1";
import { httpLogger } from "./middlewares/http-logger.middleware";

const app = new OpenAPIHono();
const publicPath = process.env.API_PUBLIC_PATH || "";

app.use(
  "/*",
  cors({
    origin: (origin, c) => {
      const whitelist = [
        "https://anami.ikedadev.com", // Tu Web Producción
        "https://temucomasajes.cl", // Tu Web Producción
        "http://localhost:4321", // Tu Web Local (Astro)
      ];
      if (!origin) return "*";

      if (whitelist.includes(origin)) {
        return origin;
      }
      return null;
    },
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.use(logger());
app.use("/*", httpLogger);

// --- RUTAS ---
// Montamos todo el router v1 bajo el prefijo "/v1"
app.route("/v1", v1);

// --- DOCUMENTACIÓN ---
// (Esto sigue igual, Hono detectará automáticamente el prefijo /v1 en la doc)
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Anami Masoterapia API",
    description: "Backend profesional para gestión de citas",
  },
  servers: [
    {
      url: `${publicPath}`, // Esto le dice a Scalar: "Todas las peticiones empiezan con /anami"
      description: "Servidor Principal",
    },
  ],
});

app.get(
  "/reference",
  Scalar({
    theme: "purple",
    spec: { url: `${publicPath}/doc` },
  } as any)
);

export default app;
