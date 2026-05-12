import { ClientMongoRepository } from "../repository/client-mongo.reposiroty";

abstract class DeleteUserUseCase {
  abstract execute(id: string): Promise<boolean>;
}

export class DeleteUser implements DeleteUserUseCase {
  constructor(private readonly repository: ClientMongoRepository) {}

  execute(id: string): Promise<boolean> {
    const isDeleted = this.repository.delete(id);
    return isDeleted;
  }
}
