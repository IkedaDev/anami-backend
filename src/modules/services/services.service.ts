import { Criteria, FilterOperator } from "@core/criteria/criteria";
import { FindServices } from "./use-cases/find-service.use-case";
import { ServiceMongoRepository } from "./repository/service-mongo.repository";
import { HTTPException } from "hono/http-exception";
import { CreateService } from "./use-cases/create-service.use-case";
import { CreateServiceDTO } from "./domain/dto/create-service.dto";
import { UpdateServiceDTO } from "./domain/dto/update-service.dto";
import { UpdateService } from "./use-cases/update-service.use-case";
import { DeleteService } from "./use-cases/delete-service.use-case";

export class ServicesService {
  private readonly serviceRepository = new ServiceMongoRepository();

  findBy(body: Criteria) {
    const results = new FindServices(this.serviceRepository).execute(body);
    return results;
  }

  async findOne(id: string) {
    const results = await new FindServices(this.serviceRepository).execute(
      new Criteria({
        pagination: { page: 1, limit: 1 },
        filters: [{ field: "id", value: id, operator: FilterOperator.EQUAL }],
      }),
    );

    if (results.data.length < 1) {
      throw new HTTPException(404, { message: "Service not found" });
    }

    return results.data[0];
  }

  create(data: CreateServiceDTO) {
    return new CreateService(this.serviceRepository).execute(data);
  }

  update(id: string, data: UpdateServiceDTO) {
    return new UpdateService(this.serviceRepository).execute(id, data);
  }

  async delete(id: string) {
    const isDeleted = await new DeleteService(this.serviceRepository).execute(
      id,
    );

    if (!isDeleted) {
      throw new HTTPException(404, { message: "Service not found" });
    }

    return isDeleted;
  }
}
