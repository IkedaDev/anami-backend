import { Client } from "../model/client.model";
import { CreateClientDTO } from "../dto/create-request.dto";
import { UpdateClientDTO } from "../dto/update-request.dto";
import { FindByResponseRepository } from "@core/pagination";
import { Criteria } from "@core/criteria/criteria";

export abstract class ClientRepository {
  abstract findBy(req: Criteria): Promise<FindByResponseRepository<Client>>;
  abstract create(req: CreateClientDTO): Promise<Client>;
  abstract update(id: string, req: UpdateClientDTO): Promise<Client>;
  abstract delete(id: string): Promise<boolean>;
  abstract getMetrics(): Promise<any>;
}

