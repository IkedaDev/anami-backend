import { CriteriaRequestSchema } from "@core/criteria/schemas/criteria-request.schema";
import { z } from "@hono/zod-openapi";

export type FindByRequestDTO = z.infer<typeof CriteriaRequestSchema>;
