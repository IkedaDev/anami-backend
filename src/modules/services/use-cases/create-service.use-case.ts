import { CreateServiceDTO } from "../domain/dto/create-service.dto";
import { Service } from "../domain/model/service.model";
import { ServiceRepository } from "../domain/repository/service.repository";

abstract class CreateServiceUseCase {
  abstract execute(service: CreateServiceDTO): Promise<Service>;
}

export class CreateService implements CreateServiceUseCase {
  constructor(private readonly repository: ServiceRepository) {}

  execute(serviceDto: CreateServiceDTO): Promise<Service> {
    const service = this.repository.create(serviceDto);
    return service;
  }
}
