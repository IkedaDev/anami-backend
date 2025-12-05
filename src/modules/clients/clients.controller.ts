import { Context } from "hono";
import { ClientsService } from "./clients.service";
import { ApiResponse } from "../../core/api-response";

export class ClientsController {
  constructor(private service: ClientsService) {}

  getAll = async (c: Context) => {
    // Leemos el query param ?q=...
    const query = c.req.query("q");
    const clients = await this.service.findAll(query);
    return ApiResponse.success(c, clients);
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
      201
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
        "Client updated successfully"
      );
    } catch (error) {
      return ApiResponse.error(c, "Client not found", null, 404);
    }
  };
}
