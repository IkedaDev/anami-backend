import { Context } from "hono";
import { ClientsService } from "../clients.service";
import { ApiResponse } from "@core/api-response";
import { paginate } from "@core/pagination";

export class ClientsController {
  constructor(private service: ClientsService) {}

  findBy = async (c: Context) => {
    const { page, limit } = c.req.valid("query" as never);
    const body = c.req.valid("json" as never);

    const result = await this.service.findBy({
      pagination: { page, limit },
      ...(body as Object),
    });

    return ApiResponse.successPaginated(
      c,
      result,
      "Clients retrieved successfully",
    );
  };

  getOne = async (c: Context) => {
    const id = c.req.param("id");
    const client = await this.service.findOne(id);

    if (!client) {
      return ApiResponse.error(c, "Client not found", null, 404);
    }
    return ApiResponse.success(c, client);
  };

  create = async (c: Context) => {
    // Usamos 'as never' o 'as any' para evitar el conflicto de tipos que vimos antes
    const body = await c.req.valid("json" as never);
    const newClient = await this.service.create(body);
    return ApiResponse.success(
      c,
      newClient,
      "Client registered successfully",
      201,
    );
  };
  update = async (c: Context) => {
    const id = c.req.param("id");
    // Usamos 'as never' como preferiste para evitar conflictos de tipo
    const body = await c.req.valid("json" as never);

    try {
      const updatedClient = await this.service.update(id, body);
      return ApiResponse.success(
        c,
        updatedClient,
        "Client updated successfully",
      );
    } catch (error) {
      return ApiResponse.error(c, "Client not found", null, 404);
    }
  };
}
