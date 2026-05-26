import { Context } from "hono";
import { ClientsService } from "../clients.service";
import { APIResponse, TypeResponse } from "@core/decorators/api-response";
import { Criteria } from "@core/criteria/criteria";

export class ClientsController {
  constructor(private service: ClientsService) {}

  @APIResponse({
    message: "Clients retrieved successfully",
    type: TypeResponse.PAGINATED,
  })
  async findBy(c: Context) {
    const { filters, orderBy, orderType, pagination } = c.req.valid(
      "json" as never,
    );

    return await this.service.findBy(
      new Criteria({ filters, pagination, orderBy, orderType }),
    );
  }

  @APIResponse("Client retrieved successfully")
  async findOne(c: Context) {
    const id = c.req.param("id");
    return await this.service.findOne(id!);
  }

  @APIResponse({ message: "Client registered successfully", status: 201 })
  async create(c: Context) {
    const body = c.req.valid("json" as never);
    return await this.service.create(body);
  }

  @APIResponse("Client updated successfully")
  async update(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.valid("json" as never);
    return await this.service.update(id!, body);
  }

  @APIResponse("Client deleted successfully")
  async delete(c: Context) {
    const id = c.req.param("id");
    return await this.service.delete(id!);
  }

  @APIResponse("Metrics retrieved successfully")
  async getMetrics(c: Context) {
    return await this.service.getMetrics();
  }
}

