import { z } from "@hono/zod-openapi";
import { createServiceSchema } from "./create-service.dto";

export type UpdateServiceDTO = z.infer<typeof updateServiceSchema>;
export const updateServiceSchema = createServiceSchema.partial();
