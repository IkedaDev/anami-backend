import { z } from "@hono/zod-openapi";
import { createClientSchema } from "./create-request.dto";

export type UpdateClientDTO = z.infer<typeof updateClientSchema>;

// Schema para ACTUALIZAR (Partial)
export const updateClientSchema = createClientSchema.partial();
