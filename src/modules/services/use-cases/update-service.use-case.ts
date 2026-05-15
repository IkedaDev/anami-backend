import { UpdateServiceDTO } from "../domain/dto/update-service.dto";
import { Service } from "../domain/model/service.model";
import { ServiceRepository } from "../domain/repository/service.repository";

abstract class UpdateServiceUseCase {
  abstract execute(id: string, req: UpdateServiceDTO): Promise<Service>;
}

export class UpdateService implements UpdateServiceUseCase {
  constructor(private readonly repository: ServiceRepository) {}

  execute(id: string, req: UpdateServiceDTO): Promise<Service> {
    const updatedService = this.repository.update(id, req);
    return updatedService;
  }
}
