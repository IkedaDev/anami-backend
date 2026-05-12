import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import "dotenv/config";
import { logger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
import v1 from "./routes/v1";
import { httpLogger } from "./middlewares/http-logger.middleware";
import { Envs } from "@config/env";

const app = new OpenAPIHono();
const publicPath = Envs.API_PUBLIC_PATH || "";

app.use(
  "/*",
  cors({
    origin: (origin, c) => {
      const whitelist = [
        "https://anami.ikedadev.com",
        "https://temucomasajes.cl",
        "https://qa.temucomasajes.cl",
        "http://localhost:4321",
        "http://localhost:4200",
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
  }),
);

app.use(logger());
app.use("/*", httpLogger);

// --- RUTAS ---
// Montamos todo el router v1 bajo el prefijo "/v1"
app.route("/v1", v1);

app.openAPIRegistry.registerComponent("securitySchemes", "BearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Ingresa tu token JWT para acceder a los endpoints protegidos",
});

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Anami Masoterapia API",
    description: "Backend de Anami Masoterapia ",
  },
  servers: [
    {
      url: `${publicPath}`, // Esto le dice a Scalar: "Todas las peticiones empiezan con /anami"
      description: "Servidor Principal",
    },
  ],
});

app.get(
  "/docs",
  swaggerUI({
    url: `${publicPath}/doc`,
  }),
);
app.get("", (c) => c.redirect("/docs"));

export default app;
