import { ServiceRepository } from "../domain/repository/service.repository";

abstract class DeleteServiceUseCase {
  abstract execute(id: string): Promise<boolean>;
}

export class DeleteService implements DeleteServiceUseCase {
  constructor(private readonly repository: ServiceRepository) {}

  execute(id: string): Promise<boolean> {
    const isDeleted = this.repository.delete(id);
    return isDeleted;
  }
}
