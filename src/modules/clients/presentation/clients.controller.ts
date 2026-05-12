import { Context } from "hono";
import { ClientsService } from "../clients.service";
import { ApiResponse } from "@core/api-response";
import { HTTPException } from "hono/http-exception";

export class ClientsController {
  constructor(private service: ClientsService) {}

  findBy = async (c: Context) => {
    try {
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
    } catch (error) {
      if (error instanceof HTTPException) {
        return ApiResponse.error(c, error.message, null, error.status as any);
      }
      return ApiResponse.error(c, "Error", error, 500);
    }
  };

  findOne = async (c: Context) => {
    try {
      const id = c.req.param("id");
      const client = await this.service.findOne(id);

      return ApiResponse.success(c, client);
    } catch (error) {
      if (error instanceof HTTPException) {
        return ApiResponse.error(c, error.message, null, error.status as any);
      }
      return ApiResponse.error(c, "Error", error, 500);
    }
  };

  create = async (c: Context) => {
    try {
      const body = c.req.valid("json" as never);
      const newClient = await this.service.create(body);
      return ApiResponse.success(
        c,
        newClient,
        "Client registered successfully",
        201,
      );
    } catch (error) {
      if (error instanceof HTTPException) {
        return ApiResponse.error(c, error.message, null, error.status as any);
      }
      return ApiResponse.error(c, "Error", error, 500);
    }
  };

  update = async (c: Context) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.valid("json" as never);
      const updatedClient = await this.service.update(id, body);
      return ApiResponse.success(
        c,
        updatedClient,
        "Client updated successfully",
      );
    } catch (error) {
      if (error instanceof HTTPException) {
        return ApiResponse.error(c, error.message, null, error.status as any);
      }
      return ApiResponse.error(c, "Error", error, 500);
    }
  };

  delete = async (c: Context) => {
    try {
      const id = c.req.param("id");
      const deletedClient = await this.service.delete(id);
      return ApiResponse.success(
        c,
        deletedClient,
        "Client deleted successfully",
      );
    } catch (error) {
      if (error instanceof HTTPException) {
        return ApiResponse.error(c, error.message, null, error.status as any);
      }
      return ApiResponse.error(c, "Error", error, 500);
    }
  };
}
