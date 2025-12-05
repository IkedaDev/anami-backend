import { Context } from "hono";
import { ServicesService } from "./services.service";
import { ApiResponse } from "../../core/api-response";

export class ServicesController {
  constructor(private service: ServicesService) {}

  getAll = async (c: Context) => {
    const services = await this.service.findAll();
    return ApiResponse.success(c, services);
  };

  getOne = async (c: Context) => {
    const id = c.req.param("id");
    const item = await this.service.findOne(id);

    if (!item) {
      return ApiResponse.error(c, "Service not found", null, 404);
    }
    return ApiResponse.success(c, item);
  };

  create = async (c: Context) => {
    // Hono + Zod ya validaron el body aquí, así que es seguro
    const body = await c.req.valid("json" as never);
    const newItem = await this.service.create(body);
    return ApiResponse.success(c, newItem, "Service created successfully", 201);
  };

  update = async (c: Context) => {
    const id = c.req.param("id");
    const body = await c.req.valid("json" as never);

    try {
      const updated = await this.service.update(id, body);
      return ApiResponse.success(c, updated, "Service updated");
    } catch (error) {
      return ApiResponse.error(
        c,
        "Service not found or update failed",
        null,
        404
      );
    }
  };

  delete = async (c: Context) => {
    const id = c.req.param("id");
    try {
      await this.service.delete(id);
      return ApiResponse.success(c, null, "Service deleted successfully");
    } catch (error) {
      return ApiResponse.error(c, "Service not found", null, 404);
    }
  };
}
