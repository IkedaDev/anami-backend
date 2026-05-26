import { Criteria } from "@core/criteria/criteria";
import { CreateServiceDTO } from "../dto/create-service.dto";
import { UpdateServiceDTO } from "../dto/update-service.dto";
import { Service } from "../model/service.model";
import { FindByResponseRepository } from "@core/pagination";

export abstract class ServiceRepository {
  abstract findBy(req: Criteria): Promise<FindByResponseRepository<Service>>;
  abstract create(req: CreateServiceDTO): Promise<Service>;
  abstract update(id: string, req: UpdateServiceDTO): Promise<Service>;
  abstract delete(id: string): Promise<boolean>;
  abstract getMetrics(): Promise<any>;
}

