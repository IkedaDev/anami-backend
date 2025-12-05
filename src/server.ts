import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { Scalar } from "@scalar/hono-api-reference";
import v1 from "./routes/v1";

const app = new OpenAPIHono();

app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.use(logger());

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
});

app.get(
  "/reference",
  Scalar({
    theme: "purple",
    spec: { url: "/doc" },
  } as any)
);

export default app;
