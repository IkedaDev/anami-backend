import { Context } from "hono";
import { ServicesService } from "../services.service";
import { APIResponse, TypeResponse } from "@core/decorators/api-response";
import { Criteria } from "@core/criteria/criteria";

export class ServicesController {
  constructor(private service: ServicesService) {}

  @APIResponse({
    message: "Services retrieved successfully",
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

  @APIResponse("Service retrieved successfully")
  async findOne(c: Context) {
    const id = c.req.param("id");
    return await this.service.findOne(id!);
  }

  @APIResponse({ message: "Service created successfully", status: 201 })
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

  @APIResponse("Service deleted successfully")
  async delete(c: Context) {
    const id = c.req.param("id");
    return await this.service.delete(id!);
  }
}
