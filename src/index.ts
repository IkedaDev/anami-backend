import { serve } from "@hono/node-server";
import app from "./server"; // Importamos la app configurada

const port = 3000;

console.log(`🚀 Server running on port ${port}`);
console.log(`📄 Docs available at http://localhost:${port}/reference`);

serve({
  fetch: app.fetch,
  port,
});
