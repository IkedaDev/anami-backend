import { z } from "@hono/zod-openapi";
import { createClientSchema } from "./create-request.dto";

export type UpdateClientDTO = z.infer<typeof updateClientSchema>;

export const updateClientSchema = createClientSchema.partial();
